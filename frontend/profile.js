document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    const messageArea = document.getElementById('messageArea');

    // Selectors
    const stepNodes = document.querySelectorAll('.step-node');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressPercent = document.getElementById('progressPercent');
    const timelineLineFill = document.getElementById('timelineLineFill');

    let currentLang = 'English';
    let base64ProfileImage = '';

    // Translation Dictionary
    const translations = {
        English: {
            brandTitle: "NEUTRIX HEALTH",
            brandSub: "Post-Discharge Patient Portal",
            themeDark: "Dark Mode",
            themeLight: "Light Mode",
            print: "Print Chart",
            printCard: "Print Recovery ID",
            reset: "Reset Form",
            headerTitle: "Patient Intake & Caregiver Registration",
            headerSub: "Complete clinical baseline parameters for post-discharge care management.",
            progressLabel: "Profile Completion",
            tab1: "Patient Information",
            tab2: "Medical Baseline",
            tab3: "Caregiver & Support",
            sec1: "1. Patient Information",
            sec2: "2. Pre-Existing Conditions & Medications",
            sec3: "3. Designated Caregiver & Communication",
            uploadBtn: "📷 Upload Profile Photo",
            lblName: "Full Legal Name",
            lblAge: "Age (Years)",
            lblGender: "Gender",
            lblBlood: "Blood Group",
            lblCond: "Primary Pre-Existing Medical Condition",
            lblAllergies: "Known Adverse Drug Reactions & Allergies",
            quickAllergies: "Click to quick-add common allergies:",
            lblMedsTitle: "Routine Daily Prescription Medications",
            medsHint: "Add daily medicines broken down by name, time, and dosage.",
            addMed: "Add Another Medication",
            lblCaregiverName: "Primary Caregiver Name",
            lblCaregiverPhone: "Primary Contact Phone",
            lblLang: "Care Summary Output Language",
            btnNext1: "Proceed to Medical Baseline →",
            btnNext2: "Proceed to Caregiver Setup →",
            btnBack1: "← Back to Demographics",
            btnBack2: "← Back to Medical Baseline",
            btnSave: "💾 Save & Sync Hospital Record",
            chartTitle: "CLINICAL CHART PREVIEW",
            chartCond: "Pre-Existing Condition",
            chartAllergies: "Adverse Drug Reactions / Allergies",
            chartMeds: "Daily Maintenance Medications",
            chartCaregiver: "Primary Caregiver Contact",
            chartLang: "Summary Language"
        },
        Malayalam: {
            brandTitle: "ന്യൂട്രിക്സ് ഹെൽത്ത്",
            brandSub: "ഡിസ്ചാർജ് ശേഷമുള്ള പേഷ്യന്റ് പോർട്ടൽ",
            themeDark: "ഡാർക്ക് മോഡ്",
            themeLight: "ലൈറ്റ് മോഡ്",
            print: "പ്രിന്റ് ചെയ്യുക",
            printCard: "ഐഡി പ്രിന്റ് ചെയ്യുക",
            reset: "റീസെറ്റ് ചെയ്യുക",
            headerTitle: "പേഷ്യന്റ് & കെയർഗിവർ വിവരങ്ങൾ",
            headerSub: "ഡിസ്ചാർജിനു ശേഷമുള്ള പരിചരണത്തിന് വിവരങ്ങൾ നൽകുക.",
            progressLabel: "പ്രൊഫൈൽ പൂർത്തീകരണം",
            tab1: "രോഗിയുടെ വിവരങ്ങൾ",
            tab2: "മെഡിക്കൽ വിവരങ്ങൾ",
            tab3: "പരിചാരകന്റെ വിവരങ്ങൾ",
            sec1: "1. രോഗിയുടെ അടിസ്ഥാന വിവരങ്ങൾ",
            sec2: "2. ആരോഗ്യ സ്ഥിതിയും മരുന്നുകളും",
            sec3: "3. പരിചാരകന്റെ വിവരങ്ങൾ",
            uploadBtn: "📷 ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക",
            lblName: "പൂർണ്ണ നാമം",
            lblAge: "വയസ്സ്",
            lblGender: "ലിംഗം",
            lblBlood: "രക്തഗ്രൂപ്പ്",
            lblCond: "നിലവിലുള്ള ആരോഗ്യ പ്രശ്നങ്ങൾ",
            lblAllergies: "അലർജികൾ / മരുന്ന് പ്രതിപ്രവർത്തനങ്ങൾ",
            quickAllergies: "സാധാരണ അലർജികൾ തിരഞ്ഞെടുക്കുക:",
            lblMedsTitle: "ദിവസേന കഴിക്കുന്ന മരുന്നുകൾ",
            medsHint: "മരുന്നിന്റെ പേര്, സമയം, അളവ് എന്നിവ ചേർക്കുക.",
            addMed: "മറ്റൊരു മരുന്ന് ചേർക്കുക",
            lblCaregiverName: "പരിചാരകന്റെ പേര്",
            lblCaregiverPhone: "ഫോൺ നമ്പർ",
            lblLang: "റിപ്പോർട്ട് ഭാഷ",
            btnNext1: "മെഡിക്കൽ വിവരങ്ങളിലേക്ക് →",
            btnNext2: "പരിചാരകന്റെ വിവരങ്ങളിലേക്ക് →",
            btnBack1: "← തിരികെ പോകുക",
            btnBack2: "← തിരികെ പോകുക",
            btnSave: "💾 സേവ് ചെയ്യുക",
            chartTitle: "പേഷ്യന്റ് ചാർട്ട് പ്രിവ്യൂ",
            chartCond: "ആരോഗ്യ പ്രശ്നങ്ങൾ",
            chartAllergies: "അലർജികൾ",
            chartMeds: "ദിവസേനയുള്ള മരുന്നുകൾ",
            chartCaregiver: "പരിചാരകന്റെ വിവരങ്ങൾ",
            chartLang: "തിരഞ്ഞെടുത്ത ഭാഷ"
        }
    };

    initMRN();
    bindEvents();
    loadSavedProfile();

    function bindEvents() {
        // Theme Toggle
        document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);

        // Language Switcher
        document.getElementById('langToggleBtn').addEventListener('click', () => {
            currentLang = currentLang === 'English' ? 'Malayalam' : 'English';
            applyLanguage(currentLang);
        });

        // Timeline Step Navigation
        stepNodes.forEach(node => {
            node.addEventListener('click', () => switchTab(node.dataset.tab));
        });

        document.querySelectorAll('.next-tab').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.next));
        });

        document.querySelectorAll('.prev-tab').forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.prev));
        });

        // Image Upload
        document.getElementById('profilePicInput').addEventListener('change', handleImageUpload);
        document.getElementById('removePicBtn').addEventListener('click', removeProfilePhoto);

        // Quick Allergy Chips
        document.querySelectorAll('.allergy-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const allergyText = chip.dataset.allergy;
                const allergiesBox = document.getElementById('allergies');
                if (allergiesBox.value.trim() === '' || allergiesBox.value === 'None reported') {
                    allergiesBox.value = allergyText;
                } else if (!allergiesBox.value.includes(allergyText)) {
                    allergiesBox.value += `, ${allergyText}`;
                }
                validateInput(allergiesBox);
                syncFormState();
            });
        });

        // Medication Builder
        document.getElementById('addMedBtn').addEventListener('click', () => addMedicationRow());

        document.getElementById('medicationList').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-med-btn')) {
                const rows = document.querySelectorAll('.med-row');
                if (rows.length > 1) {
                    e.target.closest('.med-row').remove();
                    syncFormState();
                }
            }
        });

        // Real-time Input Validation & Progress Calculator
        const inputs = profileForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                validateInput(e.target);
                syncFormState();
            });
            input.addEventListener('change', (e) => {
                validateInput(e.target);
                syncFormState();
            });
        });

        // Form Submission
        profileForm.addEventListener('submit', handleFormSubmit);

        // ID Card Print Buttons
        document.getElementById('printCardBtn').addEventListener('click', printEmergencyCard);
        document.getElementById('sidePrintCardBtn').addEventListener('click', printEmergencyCard);

        // Header Utilities
        document.getElementById('printBtn').addEventListener('click', () => window.print());
        document.getElementById('resetBtn').addEventListener('click', handleReset);
    }

    // Input Validation
    function validateInput(field) {
        let isValid = true;
        const val = field.value.trim();

        if (field.hasAttribute('required') && !val) {
            isValid = false;
        } else if (field.id === 'age' && (isNaN(val) || val < 1 || val > 120)) {
            isValid = false;
        } else if (field.id === 'caregiverPhone' && val && val !== 'Not provided' && !/^[+0-9\s-]{7,15}$/.test(val)) {
            isValid = false;
        }

        field.classList.remove('valid-flash', 'invalid-flash');
        void field.offsetWidth;

        if (isValid && val) {
            field.classList.add('valid-flash');
            setTimeout(() => field.classList.remove('valid-flash'), 1800);
        } else if (!isValid) {
            field.classList.add('invalid-flash');
        }
        return isValid;
    }

    // Tab Switcher
    function switchTab(targetId) {
        stepNodes.forEach((node, index) => {
            const isActive = node.dataset.tab === targetId;
            node.classList.toggle('active', isActive);

            if (isActive) {
                const percent = (index / (stepNodes.length - 1)) * 100;
                timelineLineFill.style.width = `${percent}%`;
            }
        });

        tabPanes.forEach(pane => {
            pane.classList.toggle('active', pane.id === targetId);
        });
    }

    // Progress Bar
    function updateProgressBar() {
        const patientName = document.getElementById('patientName').value.trim();
        const caregiverName = document.getElementById('caregiverName').value.trim();
        const caregiverPhone = document.getElementById('caregiverPhone').value.trim();
        const allergies = document.getElementById('allergies').value.trim();
        const condition = document.getElementById('conditions').value;

        let score = 0;
        if (patientName) score += 30;
        if (caregiverName) score += 30;
        if (caregiverPhone) score += 15;
        if (allergies) score += 10;
        if (condition !== 'None') score += 10;
        if (base64ProfileImage) score += 5;

        progressBarFill.style.width = `${score}%`;
        progressPercent.textContent = `${score}%`;
    }

    // Print Emergency Recovery ID Card
    function printEmergencyCard() {
        const data = collectFormData();

        document.getElementById('cardPatientName').textContent = (data.patientName || 'UNREGISTERED PATIENT').toUpperCase();
        document.getElementById('cardPatientMeta').textContent = `Age: ${data.age || '--'} | Gender: ${data.gender || '--'} | Blood: ${data.bloodGroup || '--'}`;
        document.getElementById('cardCaregiver').textContent = data.caregiverName || 'Not Set';
        document.getElementById('cardPhone').textContent = data.caregiverPhone;
        document.getElementById('cardAllergies').textContent = data.allergies;
        document.getElementById('cardCondition').textContent = data.condition;
        document.getElementById('cardLanguage').textContent = data.language;
        document.getElementById('cardMrn').textContent = data.mrn;

        const photoImg = document.getElementById('cardPhotoImg');
        const photoLetter = document.getElementById('cardPhotoLetter');

        if (data.profileImage) {
            photoImg.src = data.profileImage;
            photoImg.classList.remove('hidden');
            photoLetter.classList.add('hidden');
        } else {
            photoImg.classList.add('hidden');
            photoLetter.classList.remove('hidden');
            photoLetter.textContent = data.patientName ? data.patientName.charAt(0).toUpperCase() : 'P';
        }

        const printableContainer = document.getElementById('printableCardContainer');
        printableContainer.classList.remove('hidden');

        window.print();

        setTimeout(() => {
            printableContainer.classList.add('hidden');
        }, 1000);
    }

    // Form Submit Handler
    function handleFormSubmit(e) {
        e.preventDefault();

        const patientName = document.getElementById('patientName');
        const caregiverName = document.getElementById('caregiverName');

        const isNameValid = validateInput(patientName);
        const isCaregiverValid = validateInput(caregiverName);

        if (!isNameValid || !isCaregiverValid) {
            messageArea.innerHTML = `<div class="alert-warning">⚠️ Validation Error: Please fill in mandatory patient and caregiver details correctly.</div>`;
            return;
        }

        const data = collectFormData();
        localStorage.setItem('neutrix_hospital_profile', JSON.stringify(data));
        messageArea.innerHTML = `<div class="alert-success">✓ Profile saved & synchronized successfully!</div>`;
        updateChartPreview(data);
    }

    // Dynamic Medication Builder
    function addMedicationRow(name = '', time = 'Morning (Breakfast)', dose = '') {
        const medList = document.getElementById('medicationList');
        const row = document.createElement('div');
        row.className = 'med-row';
        row.innerHTML = `
            <input type="text" class="modern-input med-name" placeholder="Medication Name" value="${name}">
            <select class="modern-select med-time">
                <option value="Morning (Breakfast)" ${time.includes('Morning') ? 'selected' : ''}>Morning (Breakfast)</option>
                <option value="Afternoon (Lunch)" ${time.includes('Afternoon') ? 'selected' : ''}>Afternoon (Lunch)</option>
                <option value="Night (Dinner)" ${time.includes('Night') ? 'selected' : ''}>Night (Dinner)</option>
                <option value="Twice Daily (Morning & Night)" ${time.includes('Twice') ? 'selected' : ''}>Twice Daily</option>
                <option value="Three Times Daily" ${time.includes('Three') ? 'selected' : ''}>Three Times Daily</option>
                <option value="As Needed (PRN)" ${time.includes('Needed') ? 'selected' : ''}>As Needed (PRN)</option>
            </select>
            <input type="text" class="modern-input med-dose" placeholder="Dosage (e.g. 500mg)" value="${dose}">
            <button type="button" class="btn-icon remove-med-btn" title="Remove Prescription">✕</button>
        `;

        row.querySelectorAll('input, select').forEach(elem => {
            elem.addEventListener('input', syncFormState);
            elem.addEventListener('change', syncFormState);
        });

        medList.appendChild(row);
    }

    function collectFormData() {
        const medRows = document.querySelectorAll('.med-row');
        const medications = [];

        medRows.forEach(row => {
            const name = row.querySelector('.med-name').value.trim();
            const time = row.querySelector('.med-time').value;
            const dose = row.querySelector('.med-dose').value.trim();
            if (name) {
                medications.push({ name, time, dose: dose || 'Standard' });
            }
        });

        return {
            patientName: document.getElementById('patientName').value.trim(),
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            bloodGroup: document.getElementById('bloodGroup').value,
            condition: document.getElementById('conditions').value,
            allergies: document.getElementById('allergies').value.trim() || 'None reported',
            medications,
            caregiverName: document.getElementById('caregiverName').value.trim(),
            caregiverPhone: document.getElementById('caregiverPhone').value.trim() || 'Not provided',
            language: document.getElementById('language').value,
            profileImage: base64ProfileImage,
            mrn: document.getElementById('mrnDisplay').textContent
        };
    }

    function syncFormState() {
        updateProgressBar();
        updateChartPreview(collectFormData());
    }

    function updateChartPreview(data) {
        document.getElementById('prevName').textContent = data.patientName || 'Unregistered Patient';
        document.getElementById('prevMeta').textContent = `Age ${data.age || '--'} • Gender ${data.gender || '--'} • Blood ${data.bloodGroup || '--'}`;

        const avatarLetter = document.getElementById('avatarLetter');
        const chartAvatarImg = document.getElementById('chartAvatarImage');

        if (data.profileImage) {
            chartAvatarImg.src = data.profileImage;
            chartAvatarImg.classList.remove('hidden');
            avatarLetter.classList.add('hidden');
        } else {
            chartAvatarImg.classList.add('hidden');
            avatarLetter.classList.remove('hidden');
            avatarLetter.textContent = data.patientName ? data.patientName.charAt(0).toUpperCase() : 'P';
        }

        document.getElementById('prevConditions').innerHTML = `<span class="clinical-tag">${data.condition || 'None'}</span>`;
        document.getElementById('prevAllergies').textContent = data.allergies;

        const medsContainer = document.getElementById('prevMedsContainer');
        medsContainer.innerHTML = '';

        if (data.medications && data.medications.length > 0) {
            data.medications.forEach(med => {
                const item = document.createElement('div');
                item.className = 'med-pill-item';
                item.innerHTML = `
                    <strong>${escapeHtml(med.name)} (${escapeHtml(med.dose)})</strong>
                    <span>⏰ ${escapeHtml(med.time)}</span>
                `;
                medsContainer.appendChild(item);
            });
        } else {
            medsContainer.innerHTML = '<p class="field-value">None reported</p>';
        }

        document.getElementById('prevCaregiver').textContent = data.caregiverName || 'Not Set';
        document.getElementById('prevPhone').textContent = data.caregiverPhone;
        document.getElementById('prevLang').textContent = data.language;
    }

    // Image Upload Handlers
    function handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size exceeds 2MB limit.');
                return;
            }
            const reader = new FileReader();
            reader.onload = function (event) {
                base64ProfileImage = event.target.result;
                const avatarImg = document.getElementById('avatarImage');
                avatarImg.src = base64ProfileImage;
                avatarImg.classList.remove('hidden');
                document.getElementById('avatarPlaceholder').classList.add('hidden');
                document.getElementById('removePicBtn').classList.remove('hidden');
                syncFormState();
            };
            reader.readAsDataURL(file);
        }
    }

    function removeProfilePhoto() {
        base64ProfileImage = '';
        document.getElementById('profilePicInput').value = '';
        document.getElementById('avatarImage').classList.add('hidden');
        document.getElementById('avatarPlaceholder').classList.remove('hidden');
        document.getElementById('removePicBtn').classList.add('hidden');
        syncFormState();
    }

    // Theme & Translation Helpers
    function toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', nextTheme);

        document.getElementById('themeIcon').textContent = nextTheme === 'dark' ? '☀️' : '🌙';
        document.getElementById('txt-theme').textContent = nextTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    function applyLanguage(lang) {
        const dict = translations[lang];
        if (!dict) return;

        document.getElementById('txt-brand-title').textContent = dict.brandTitle;
        document.getElementById('txt-brand-sub').textContent = dict.brandSub;
        document.getElementById('txt-print').textContent = dict.print;
        if (document.getElementById('txt-print-card')) document.getElementById('txt-print-card').textContent = dict.printCard;
        document.getElementById('txt-reset').textContent = dict.reset;
        document.getElementById('txt-header-title').textContent = dict.headerTitle;
        document.getElementById('txt-header-sub').textContent = dict.headerSub;
        document.getElementById('txt-progress-label').textContent = dict.progressLabel;
        document.getElementById('tab-title-1').textContent = dict.tab1;
        document.getElementById('tab-title-2').textContent = dict.tab2;
        document.getElementById('tab-title-3').textContent = dict.tab3;
        document.getElementById('txt-sec-1').textContent = dict.sec1;
        document.getElementById('txt-sec-2').textContent = dict.sec2;
        document.getElementById('txt-sec-3').textContent = dict.sec3;
        document.getElementById('txt-upload-btn').textContent = dict.uploadBtn;
        document.getElementById('lbl-patient-name').textContent = dict.lblName;
        document.getElementById('lbl-age').textContent = dict.lblAge;
        document.getElementById('lbl-gender').textContent = dict.lblGender;
        document.getElementById('lbl-blood').textContent = dict.lblBlood;
        document.getElementById('lbl-conditions').textContent = dict.lblCond;
        document.getElementById('lbl-allergies').textContent = dict.lblAllergies;
        document.getElementById('txt-quick-allergies').textContent = dict.quickAllergies;
        document.getElementById('lbl-meds-title').textContent = dict.lblMedsTitle;
        document.getElementById('txt-meds-hint').textContent = dict.medsHint;
        document.getElementById('txt-add-med').textContent = dict.addMed;
        document.getElementById('lbl-caregiver-name').textContent = dict.lblCaregiverName;
        document.getElementById('lbl-caregiver-phone').textContent = dict.lblCaregiverPhone;
        document.getElementById('lbl-language').textContent = dict.lblLang;
        document.getElementById('btn-next-1').textContent = dict.btnNext1;
        document.getElementById('btn-next-2').textContent = dict.btnNext2;
        document.getElementById('btn-back-1').textContent = dict.btnBack1;
        document.getElementById('btn-back-2').textContent = dict.btnBack2;
        document.getElementById('btn-save-final').textContent = dict.btnSave;
        document.getElementById('txt-chart-title').textContent = dict.chartTitle;
        document.getElementById('txt-chart-cond').textContent = dict.chartCond;
        document.getElementById('txt-chart-allergies').textContent = dict.chartAllergies;
        document.getElementById('txt-chart-meds').textContent = dict.chartMeds;
        document.getElementById('txt-chart-caregiver').textContent = dict.chartCaregiver;
        document.getElementById('txt-chart-lang').textContent = dict.chartLang;
        document.getElementById('txt-lang-btn').textContent = lang === 'English' ? 'മലയാളം' : 'English';
    }

    function loadSavedProfile() {
        const saved = localStorage.getItem('neutrix_hospital_profile');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                document.getElementById('patientName').value = data.patientName || '';
                document.getElementById('age').value = data.age || 25;
                document.getElementById('gender').value = data.gender || 'Female';
                document.getElementById('bloodGroup').value = data.bloodGroup || 'Select';
                document.getElementById('conditions').value = data.condition || 'None';
                document.getElementById('allergies').value = data.allergies === 'None reported' ? '' : data.allergies;
                document.getElementById('caregiverName').value = data.caregiverName || '';
                document.getElementById('caregiverPhone').value = data.caregiverPhone === 'Not provided' ? '' : data.caregiverPhone;
                document.getElementById('language').value = data.language || 'English';

                if (data.profileImage) {
                    base64ProfileImage = data.profileImage;
                    const avatarImg = document.getElementById('avatarImage');
                    avatarImg.src = base64ProfileImage;
                    avatarImg.classList.remove('hidden');
                    document.getElementById('avatarPlaceholder').classList.add('hidden');
                    document.getElementById('removePicBtn').classList.remove('hidden');
                }

                const medList = document.getElementById('medicationList');
                medList.innerHTML = '';
                if (data.medications && data.medications.length > 0) {
                    data.medications.forEach(m => addMedicationRow(m.name, m.time, m.dose));
                } else {
                    addMedicationRow();
                }

                if (data.mrn) document.getElementById('mrnDisplay').textContent = data.mrn;
                updateChartPreview(data);
            } catch (err) {
                console.error('Error loading stored EHR session:', err);
                addMedicationRow();
            }
        } else {
            addMedicationRow();
        }
    }

    function initMRN() {
        const randomCode = Math.floor(10000 + Math.random() * 90000);
        document.getElementById('mrnDisplay').textContent = `MRN: #NX-${randomCode}`;
    }

    function handleReset() {
        if (confirm('Are you sure you want to reset this record? All unsubmitted entries will be lost.')) {
            profileForm.reset();
            removeProfilePhoto();
            localStorage.removeItem('neutrix_hospital_profile');
            messageArea.innerHTML = '';
            initMRN();

            const medList = document.getElementById('medicationList');
            medList.innerHTML = '';
            addMedicationRow();

            syncFormState();
            switchTab('tab-demographics');
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});