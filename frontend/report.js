const record = loadReport();

const ACTIONS = {
    plan: {
        btn: 'planBtn', card: 'planCard', content: 'planContent',
        url: '/api/medicine-plan', field: 'plan',
        loadingKey: 'planLoading', storeKey: 'neutrixPlan'
    },
    checkups: {
        btn: 'checkupBtn', card: 'checkupCard', content: 'checkupContent',
        url: '/api/checkups', field: 'checkups',
        loadingKey: 'checkupLoading', storeKey: 'neutrixCheckups'
    }
};

const saved = {};   // saved plan / check-ups for this report
const busy = {};    // which action is currently generating

function loadAction(name) {
    const s = storeGet(ACTIONS[name].storeKey);
    if (!s || !record || s.createdAt !== record.createdAt) return null;
    if (typeof s.content === 'string') {
        s.content = { [record.language || 'English']: s.content };
    }
    return s;
}

function loadingLine(text) {
    const p = document.createElement('p');
    p.className = 'loading-line';
    p.textContent = text;
    return p;
}

// Show AI text in the current language, translating (and saving) if needed
async function showLocalized(el, map, persist) {
    const lang = neutrixLang;
    if (map[lang]) {
        el.innerHTML = renderMarkdown(map[lang]);
        return;
    }
    el.innerHTML = '';
    el.appendChild(loadingLine(t('translating')));
    try {
        await getLocalized(map, lang);
        persist();
    } catch (e) {
        if (neutrixLang !== lang) return;
        el.innerHTML = '';
        el.appendChild(loadingLine(t('translateFail')));
        const original = document.createElement('div');
        original.innerHTML = renderMarkdown(map.English || map.Malayalam || '');
        el.appendChild(original);
        return;
    }
    if (neutrixLang === lang) el.innerHTML = renderMarkdown(map[lang]);
}

function renderAllContent() {
    showLocalized(
        document.getElementById('reportSummary'),
        record.summaries,
        () => storeSet('neutrixReport', record)
    );
    for (const name in ACTIONS) {
        if (!saved[name] || busy[name]) continue;
        const action = ACTIONS[name];
        document.getElementById(action.card).classList.remove('hidden');
        showLocalized(
            document.getElementById(action.content),
            saved[name].content,
            () => storeSet(action.storeKey, saved[name])
        );
    }
    document.getElementById('planActions').classList.toggle('hidden', !saved.plan);
}

function renderDetails() {
    if (!record) return;
    let generated = record.createdAt;
    try {
        generated = new Date(record.createdAt).toLocaleString(localeFor(), { dateStyle: 'medium', timeStyle: 'short' });
    } catch (e) {}
    document.getElementById('detailDischargeName').textContent = record.dischargeName || '-';
    document.getElementById('detailBillName').textContent = record.billName || t('detailNone');
    document.getElementById('detailGeneratedOn').textContent = generated;
    document.getElementById('detailLanguageValue').textContent =
        record.language === 'Malayalam' ? 'മലയാളം' : 'English';
}

// ---------- Plan / check-ups buttons ----------
async function runAction(name) {
    const action = ACTIONS[name];
    const btn = document.getElementById(action.btn);
    const card = document.getElementById(action.card);
    const content = document.getElementById(action.content);
    const lang = neutrixLang;

    busy[name] = true;
    card.classList.remove('hidden');
    content.innerHTML = '';
    content.appendChild(loadingLine(t(action.loadingKey)));
    if (name === 'plan') document.getElementById('planActions').classList.add('hidden');
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    btn.disabled = true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    try {
        const res = await fetch(`${API_BASE}${action.url}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                report_text: record.reportText || '',
                bill_text: record.billText || '',
                language: lang
            }),
            signal: controller.signal
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();
        const text = data[action.field];

        if (data.ok === false) {
            content.textContent = text;
            return;
        }

        saved[name] = { createdAt: record.createdAt, content: { [lang]: text } };
        storeSet(action.storeKey, saved[name]);
        busy[name] = false;
        showLocalized(content, saved[name].content, () => storeSet(action.storeKey, saved[name]));
        if (name === 'plan') {
            document.getElementById('planActions').classList.remove('hidden');
            updateScheduleBtn();
        }

    } catch (err) {
        content.textContent = err.name === 'AbortError'
            ? t('askTimeout')
            : t('actionError', { msg: err.message });
    } finally {
        clearTimeout(timer);
        busy[name] = false;
        btn.disabled = false;
    }
}

// ---------- Create / open schedule ----------
function scheduleExistsForReport() {
    const s = storeGet('neutrixSchedule');
    return !!(s && s.reportId === record.createdAt);
}

function updateScheduleBtn() {
    const btn = document.getElementById('scheduleBtn');
    const key = scheduleExistsForReport() ? 'openScheduleBtn' : 'createScheduleBtn';
    btn.dataset.i18n = key;
    btn.textContent = t(key);
}

async function createSchedule() {
    if (scheduleExistsForReport()) {
        window.location.href = 'schedule.html';
        return;
    }

    const btn = document.getElementById('scheduleBtn');
    const status = document.getElementById('scheduleStatus');
    btn.disabled = true;
    status.textContent = t('scheduleLoading');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);

    try {
        const res = await fetch(`${API_BASE}/api/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                report_text: record.reportText || '',
                bill_text: record.billText || '',
                language: neutrixLang
            }),
            signal: controller.signal
        });
        if (!res.ok) throw new Error(`Server error ${res.status}`);
        const data = await res.json();

        if (data.ok === false) {
            status.textContent = data.message;
            return;
        }

        const schedule = {
            reportId: record.createdAt,
            createdAt: new Date().toISOString(),
            startDate: dayKey(new Date()),
            doses: data.doses.map((d, i) => ({ ...d, id: 'd' + i })),
            ticks: {}
        };
        storeSet('neutrixSchedule', schedule);
        window.location.href = 'schedule.html';

    } catch (err) {
        status.textContent = err.name === 'AbortError'
            ? t('askTimeout')
            : t('actionError', { msg: err.message });
    } finally {
        clearTimeout(timer);
        btn.disabled = false;
    }
}

// ---------- Page setup ----------
if (!record) {
    document.getElementById('emptyView').classList.remove('hidden');
} else {
    document.getElementById('reportView').classList.remove('hidden');
    document.getElementById('detailsBlock').classList.remove('hidden');

    saved.plan = loadAction('plan');
    saved.checkups = loadAction('checkups');

    renderDetails();
    renderAllContent();
    updateScheduleBtn();

    document.getElementById('planBtn').addEventListener('click', () => runAction('plan'));
    document.getElementById('checkupBtn').addEventListener('click', () => runAction('checkups'));
    document.getElementById('scheduleBtn').addEventListener('click', createSchedule);

    document.addEventListener('neutrix:langchange', () => {
        renderDetails();
        renderAllContent();
        updateScheduleBtn();
    });
}