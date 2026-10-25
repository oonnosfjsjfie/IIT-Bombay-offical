const SLOTS = [
    ['morning', 'slotMorning'],
    ['afternoon', 'slotAfternoon'],
    ['evening', 'slotEvening'],
    ['night', 'slotNight'],
    ['unclear', 'slotUnclear']
];

const schedule = storeGet('neutrixSchedule');
const todayKey = dayKey(new Date());
let viewKey = todayKey;
let linkMsgKey = null;
let downloadMsgKey = null;

function keyToDate(k) {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d);
}
function shiftDay(k, n) {
    const d = keyToDate(k);
    d.setDate(d.getDate() + n);
    return dayKey(d);
}
function save() {
    storeSet('neutrixSchedule', schedule);
}
// Pick the English or Malayalam version of a field
function localized(dose, field) {
    const en = dose[field + '_en'];
    const ml = dose[field + '_ml'];
    return neutrixLang === 'Malayalam' ? (ml || en || '') : (en || ml || '');
}
function ticksFor(k) {
    if (!schedule.ticks) schedule.ticks = {};
    return schedule.ticks[k] || {};
}
function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
}
function esc(s) {
    return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function formatTime(iso) {
    return new Date(iso).toLocaleTimeString(localeFor(), { hour: 'numeric', minute: '2-digit' });
}

// ---------- Main day view ----------
function renderDay() {
    const date = keyToDate(viewKey);
    document.getElementById('dayLabel').textContent =
        date.toLocaleDateString(localeFor(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('todayBadge').textContent =
        new Date().toLocaleDateString(localeFor(), { day: 'numeric', month: 'short' });

    const isToday = viewKey === todayKey;
    const isFuture = viewKey > todayKey;
    document.getElementById('todayChip').classList.toggle('hidden', !isToday);
    document.getElementById('jumpToday').classList.toggle('hidden', isToday);
    document.getElementById('prevDay').disabled = viewKey <= schedule.startDate;
    document.getElementById('futureNote').classList.toggle('hidden', !isFuture);

    const ticks = ticksFor(viewKey);
    const list = document.getElementById('slotList');
    list.innerHTML = '';

    for (const [slot, labelKey] of SLOTS) {
        const doses = schedule.doses.filter(d => d.slot === slot);
        if (doses.length === 0) continue;

        const done = doses.filter(d => ticks[d.id]).length;
        const block = el('div', 'slot-block');
        const title = el('div', 'slot-title');
        title.appendChild(el('span', '', t(labelKey)));
        title.appendChild(el('span', 'slot-count', `${done} / ${doses.length}`));
        block.appendChild(title);

        doses.forEach(dose => {
            const takenAt = ticks[dose.id];
            const row = el('label', 'dose-row' + (takenAt ? ' taken' : '') + (isFuture ? ' locked' : ''));

            const box = document.createElement('input');
            box.type = 'checkbox';
            box.className = 'dose-check';
            box.checked = !!takenAt;
            box.disabled = isFuture;
            box.addEventListener('change', () => toggleDose(dose.id, box.checked));
            row.appendChild(box);

            const info = el('div', 'dose-info');
            const name = el('div', 'dose-name');
            name.appendChild(el('strong', '', dose.medicine));
            if (dose.strength) name.appendChild(document.createTextNode(' ' + dose.strength));
            info.appendChild(name);

            const instr = [dose.dose, localized(dose, 'instruction')].filter(Boolean).join(' · ');
            if (instr) info.appendChild(el('div', 'dose-instr', instr));
            const purpose = localized(dose, 'purpose');
            if (purpose) info.appendChild(el('div', 'dose-purpose', purpose));
            if (dose.timing_assumed) info.appendChild(el('div', 'dose-warn', t('timingAssumed')));
            row.appendChild(info);

            if (takenAt) {
                row.appendChild(el('span', 'dose-time', '✓ ' + t('takenAt', { time: formatTime(takenAt) })));
            }
            block.appendChild(row);
        });
        list.appendChild(block);
    }

    const total = schedule.doses.length;
    const taken = schedule.doses.filter(d => ticks[d.id]).length;
    document.getElementById('progressCount').textContent = `${taken} / ${total}`;
    document.getElementById('progressFill').style.width = total ? `${Math.round((taken / total) * 100)}%` : '0%';
    document.getElementById('doneBanner').classList.toggle('hidden', !(total > 0 && taken === total));
    document.getElementById('downloadStatus').textContent = downloadMsgKey ? t(downloadMsgKey) : '';
}

function toggleDose(id, checked) {
    if (viewKey > todayKey) return;
    if (!schedule.ticks[viewKey]) schedule.ticks[viewKey] = {};
    if (checked) {
        schedule.ticks[viewKey][id] = new Date().toISOString();
    } else {
        delete schedule.ticks[viewKey][id];
    }
    save();
    renderAll();
}

// ---------- Sidebar ----------
function renderWeek() {
    const strip = document.getElementById('weekStrip');
    strip.innerHTML = '';
    const total = schedule.doses.length;

    for (let i = 6; i >= 0; i--) {
        const k = shiftDay(todayKey, -i);
        const beforeStart = k < schedule.startDate;
        const taken = schedule.doses.filter(d => ticksFor(k)[d.id]).length;

        const btn = el('button', 'week-day' + (k === viewKey ? ' selected' : ''));
        btn.type = 'button';
        btn.disabled = beforeStart;
        btn.appendChild(el('span', '', keyToDate(k).toLocaleDateString(localeFor(), { weekday: 'short' })));

        let dotClass = 'week-dot';
        if (beforeStart) dotClass += ' inactive';
        else if (total && taken === total) dotClass += ' full';
        else if (taken > 0) dotClass += ' partial';
        btn.appendChild(el('span', dotClass, beforeStart ? '–' : `${taken}/${total}`));

        btn.addEventListener('click', () => {
            viewKey = k;
            renderAll();
        });
        strip.appendChild(btn);
    }
}

function renderSidebar() {
    const medList = document.getElementById('medList');
    medList.innerHTML = '';
    const seen = new Set();
    schedule.doses.forEach(d => {
        const key = d.medicine + '|' + d.strength;
        if (seen.has(key)) return;
        seen.add(key);
        const item = el('div', 'med-pill-item');
        item.appendChild(el('strong', '', `${d.medicine} ${d.strength}`.trim()));
        const sub = [localized(d, 'purpose'), d.duration].filter(Boolean).join(' · ');
        if (sub) item.appendChild(el('span', '', sub));
        medList.appendChild(item);
    });

    document.getElementById('startedOn').textContent =
        keyToDate(schedule.startDate).toLocaleDateString(localeFor(), { day: 'numeric', month: 'long', year: 'numeric' });
    document.getElementById('pageLink').value = window.location.href;
    document.getElementById('linkStatus').textContent = linkMsgKey ? t(linkMsgKey) : '';
}

function renderAll() {
    renderDay();
    renderWeek();
    renderSidebar();
}

// ---------- Intake report PDF ----------
function buildReportHtml() {
    const record = loadReport();
    const slotOrder = SLOTS.map(s => s[0]);
    const slotLabel = Object.fromEntries(SLOTS.map(([slot, key]) => [slot, t(key)]));
    const doses = [...schedule.doses].sort((a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot));
    const fmtDate = k => keyToDate(k).toLocaleDateString(localeFor(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const days = [];
    for (let k = schedule.startDate; k <= todayKey; k = shiftDay(k, 1)) days.push(k);

    let scheduled = 0;
    let taken = 0;
    const perMed = new Map();
    let logRows = '';
    let anyAssumed = false;

    days.forEach(k => {
        const ticks = ticksFor(k);
        doses.forEach((d, i) => {
            const at = ticks[d.id];
            scheduled++;
            if (at) taken++;
            if (d.timing_assumed) anyAssumed = true;

            const medKey = `${d.medicine} ${d.strength}`.trim();
            const m = perMed.get(medKey) || { scheduled: 0, taken: 0 };
            m.scheduled++;
            if (at) m.taken++;
            perMed.set(medKey, m);

            logRows += `<tr class="${i === 0 ? 'day-start' : ''}">
                <td>${i === 0 ? esc(fmtDate(k)) : ''}</td>
                <td>${esc(slotLabel[d.slot])}</td>
                <td>${esc(medKey)}${d.timing_assumed ? ' *' : ''}</td>
                <td class="${at ? 'ok' : 'no'}">${esc(at ? t('pdfTakenAt', { time: formatTime(at) }) : t('pdfNotTicked'))}</td>
            </tr>`;
        });
    });

    const pct = scheduled ? Math.round((taken / scheduled) * 100) : 0;
    let medRows = '';
    perMed.forEach((m, name) => {
        const p = m.scheduled ? Math.round((m.taken / m.scheduled) * 100) : 0;
        medRows += `<tr><td>${esc(name)}</td><td>${m.scheduled}</td><td>${m.taken}</td><td>${m.scheduled - m.taken}</td><td><strong>${p}%</strong></td></tr>`;
    });

    const generated = new Date().toLocaleString(localeFor(), { dateStyle: 'medium', timeStyle: 'short' });
    const period = `${fmtDate(schedule.startDate)} – ${fmtDate(todayKey)}`;
    const reports = record && record.dischargeName ? record.dischargeName : '-';

    return `
    <style>
        .nx-pdf { width: 100%; box-sizing: border-box; padding: 4px; font-family: "Segoe UI", Roboto, "Noto Sans Malayalam", sans-serif; color: #0f172a; background: #ffffff; font-size: 12px; line-height: 1.5; }
        .nx-pdf * { box-sizing: border-box; }
        .nx-pdf .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0d9488; padding-bottom: 10px; margin-bottom: 14px; }
        .nx-pdf .brand { display: flex; align-items: center; gap: 10px; }
        .nx-pdf .cross { width: 34px; height: 34px; border-radius: 8px; background: #0d9488; color: #fff; font-weight: 800; font-size: 20px; display: flex; align-items: center; justify-content: center; }
        .nx-pdf .brand-name { font-weight: 800; font-size: 16px; }
        .nx-pdf .brand-sub { font-size: 11px; color: #64748b; }
        .nx-pdf h1 { font-size: 19px; margin: 0; color: #1e3a8a; text-align: right; }
        .nx-pdf .sub { font-size: 11px; color: #64748b; text-align: right; }
        .nx-pdf .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; background: #f1f5f9; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; }
        .nx-pdf .meta b { color: #475569; }
        .nx-pdf h2 { font-size: 14px; color: #1e3a8a; margin: 18px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .nx-pdf .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .nx-pdf .stat { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
        .nx-pdf .stat .num { font-size: 22px; font-weight: 800; color: #0d9488; }
        .nx-pdf .stat .lbl { font-size: 11px; color: #64748b; }
        .nx-pdf table { width: 100%; border-collapse: collapse; }
        .nx-pdf th { background: #0f172a; color: #fff; text-align: left; padding: 6px 8px; font-size: 11px; }
        .nx-pdf td { border-bottom: 1px solid #e2e8f0; padding: 5px 8px; vertical-align: top; }
        .nx-pdf tr { page-break-inside: avoid; }
        .nx-pdf tr.day-start td { border-top: 2px solid #cbd5e1; }
        .nx-pdf td.ok { color: #15803d; font-weight: 700; }
        .nx-pdf td.no { color: #b91c1c; }
        .nx-pdf .foot { margin-top: 16px; font-size: 10.5px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
    </style>
    <div class="nx-pdf">
        <div class="head">
            <div class="brand">
                <div class="cross">+</div>
                <div>
                    <div class="brand-name">NEUTRIX HEALTH</div>
                    <div class="brand-sub">${esc(t('brandSub'))}</div>
                </div>
            </div>
            <div>
                <h1>${esc(t('pdfTitle'))}</h1>
                <div class="sub">${esc(t('pdfSubtitle'))}</div>
            </div>
        </div>

        <div class="meta">
            <div><b>${esc(t('pdfPeriod'))}:</b> ${esc(period)}</div>
            <div><b>${esc(t('pdfGenerated'))}:</b> ${esc(generated)}</div>
            <div style="grid-column: 1 / -1;"><b>${esc(t('pdfDocuments'))}:</b> ${esc(reports)}</div>
        </div>

        <h2>${esc(t('pdfOverview'))}</h2>
        <div class="stats">
            <div class="stat"><div class="num">${scheduled}</div><div class="lbl">${esc(t('pdfScheduled'))}</div></div>
            <div class="stat"><div class="num">${taken}</div><div class="lbl">${esc(t('pdfTaken'))}</div></div>
            <div class="stat"><div class="num" style="color:#b91c1c">${scheduled - taken}</div><div class="lbl">${esc(t('pdfMissed'))}</div></div>
            <div class="stat"><div class="num">${pct}%</div><div class="lbl">${esc(t('pdfAdherence'))}</div></div>
        </div>

        <h2>${esc(t('pdfByMedicine'))}</h2>
        <table>
            <thead><tr>
                <th>${esc(t('pdfMedicine'))}</th><th>${esc(t('pdfScheduled'))}</th>
                <th>${esc(t('pdfTaken'))}</th><th>${esc(t('pdfMissed'))}</th><th>%</th>
            </tr></thead>
            <tbody>${medRows}</tbody>
        </table>

        <h2>${esc(t('pdfDailyLog'))}</h2>
        <table>
            <thead><tr>
                <th>${esc(t('pdfDate'))}</th><th>${esc(t('pdfTime'))}</th>
                <th>${esc(t('pdfMedicine'))}</th><th>${esc(t('pdfStatus'))}</th>
            </tr></thead>
            <tbody>${logRows}</tbody>
        </table>

        <div class="foot">
            ${anyAssumed ? esc(t('pdfAssumed')) + '<br>' : ''}
            ${esc(t('pdfNote'))}
        </div>
    </div>`;
}

async function downloadReport() {
    const btn = document.getElementById('downloadReportBtn');
    const status = document.getElementById('downloadStatus');

    if (!window.html2pdf) {
        downloadMsgKey = 'reportFailed';
        status.textContent = t(downloadMsgKey);
        return;
    }

    btn.disabled = true;
    downloadMsgKey = 'reportPreparing';
    status.textContent = t(downloadMsgKey);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildReportHtml();

    // The PDF tool captures a blank page if the window is scrolled,
    // so jump to the top while it works, then come back.
    const savedScroll = window.scrollY;
    window.scrollTo(0, 0);

    try {
        await html2pdf()
            .set({
                margin: [10, 10, 12, 10],
                filename: `Neutrix_Medicine_Intake_Report_${todayKey}.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
            })
            .from(wrapper)
            .save();
        downloadMsgKey = 'reportReady';
    } catch (e) {
        console.error(e);
        downloadMsgKey = 'reportFailed';
    } finally {
        window.scrollTo(0, savedScroll);
        btn.disabled = false;
        status.textContent = t(downloadMsgKey);
    }
}

// ---------- Setup ----------
if (!schedule || !Array.isArray(schedule.doses) || schedule.doses.length === 0) {
    document.getElementById('schedEmpty').classList.remove('hidden');
} else {
    if (!schedule.ticks) schedule.ticks = {};
    document.getElementById('schedView').classList.remove('hidden');
    document.getElementById('schedSide').classList.remove('hidden');

    document.getElementById('prevDay').addEventListener('click', () => {
        viewKey = shiftDay(viewKey, -1);
        renderAll();
    });
    document.getElementById('nextDay').addEventListener('click', () => {
        viewKey = shiftDay(viewKey, 1);
        renderAll();
    });
    document.getElementById('jumpToday').addEventListener('click', () => {
        viewKey = todayKey;
        renderAll();
    });

    document.getElementById('copyLinkBtn').addEventListener('click', async () => {
        const input = document.getElementById('pageLink');
        try {
            await navigator.clipboard.writeText(input.value);
            linkMsgKey = 'linkCopied';
        } catch (e) {
            input.select();
            linkMsgKey = 'linkCopyFail';
        }
        renderSidebar();
    });

    document.getElementById('downloadReportBtn').addEventListener('click', downloadReport);

    document.addEventListener('neutrix:langchange', renderAll);
    renderAll();
}