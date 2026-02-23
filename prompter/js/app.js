/* ===== Prompt Builder for Educators — app.js ===== */

const STATE = {
    categories: [],
    current: null
};

/* ---------- DOM refs ---------- */
const $categories  = document.getElementById('categories');
const $wizard      = document.getElementById('wizard');
const $backBtn     = document.getElementById('back-btn');
const $title       = document.getElementById('wizard-title');
const $form        = document.getElementById('wizard-form');
const $preview     = document.getElementById('prompt-preview');
const $copyBtn     = document.getElementById('copy-btn');
const $copyConfirm = document.getElementById('copy-confirm');

/* ===== 1. Category Cards Rendering ===== */

function loadCategories() {
    STATE.categories = TEMPLATES.categories;
    renderCategories(STATE.categories);
}

function renderCategories(categories) {
    const groups = new Map();
    for (const cat of categories) {
        const g = cat.group || 'Other';
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g).push(cat);
    }

    let html = '';
    for (const [groupName, cats] of groups) {
        html += `<h3 class="group-heading">${groupName}</h3>`;
        html += `<div class="cards-row">`;
        for (const cat of cats) {
            html += `<button class="category-card" data-id="${cat.id}">
                <span class="card-icon">${cat.icon}</span>
                <span class="card-name">${cat.name}</span>
                <span class="card-desc">${cat.description}</span>
            </button>`;
        }
        html += `</div>`;
    }
    $categories.innerHTML = html;

    $categories.querySelectorAll('.category-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = STATE.categories.find(c => c.id === btn.dataset.id);
            if (cat) openWizard(cat);
        });
    });
}

function openWizard(category) {
    STATE.current = category;
    $categories.hidden = true;
    $wizard.hidden = false;
    $title.textContent = `${category.icon} ${category.name}`;
    renderForm(category);
    updatePreview();
}

/* ===== 2. Dynamic Form Rendering ===== */

function renderForm(category) {
    let html = '';
    for (const field of category.fields) {
        const reqMark = field.required ? ' <span class="required">*</span>' : '';
        html += `<div class="form-group">`;
        html += `<label for="field-${field.id}">${field.label}${reqMark}</label>`;

        if (field.id === 'es_and_os') {
            // Es & Os get a special container that updates dynamically
            html += `<div id="es-and-os-container" class="es-and-os-container">`;
            html += `<p class="es-and-os-hint">Select a Curriculum Area and CfE Level above to see available Experiences &amp; Outcomes.</p>`;
            html += `</div>`;
        } else if (field.type === 'select') {
            html += `<select id="field-${field.id}" data-field-id="${field.id}">`;
            html += `<option value="">\u2014 Select \u2014</option>`;
            for (const opt of field.options) {
                html += `<option value="${opt}">${opt}</option>`;
            }
            html += `</select>`;
        } else if (field.type === 'textarea') {
            html += `<textarea id="field-${field.id}" data-field-id="${field.id}" rows="3"${field.placeholder ? ` placeholder="${field.placeholder}"` : ''}></textarea>`;
        } else {
            html += `<input type="text" id="field-${field.id}" data-field-id="${field.id}"${field.placeholder ? ` placeholder="${field.placeholder}"` : ''}>`;
        }

        html += `</div>`;
    }
    $form.innerHTML = html;

    // Attach listeners
    $form.querySelectorAll('[data-field-id]').forEach(el => {
        el.addEventListener('input', onFieldChange);
        el.addEventListener('change', onFieldChange);
    });
}

/* ===== 2b. Es & Os Checkbox Rendering ===== */

function onFieldChange() {
    // If subject or level changed, update Es & Os checkboxes
    const fieldId = this.dataset.fieldId;
    if (fieldId === 'subject' || fieldId === 'level') {
        updateEsAndOsCheckboxes();
    }
    updatePreview();
}

function updateEsAndOsCheckboxes() {
    const container = document.getElementById('es-and-os-container');
    if (!container) return; // Current category doesn't have es_and_os field

    const subjectEl = document.getElementById('field-subject');
    const levelEl = document.getElementById('field-level');
    if (!subjectEl || !levelEl) return;

    const subject = subjectEl.value;
    const level = levelEl.value;

    if (!subject || !level) {
        container.innerHTML = '<p class="es-and-os-hint">Select a Curriculum Area and CfE Level above to see available Experiences &amp; Outcomes.</p>';
        return;
    }

    // Look up Es & Os for this subject and level
    const areaData = ES_AND_OS[subject];
    if (!areaData || !areaData.organisers) {
        container.innerHTML = '<p class="es-and-os-hint">No Experiences &amp; Outcomes available for this curriculum area.</p>';
        return;
    }

    let html = '';
    let hasAny = false;

    for (const [organiser, levels] of Object.entries(areaData.organisers)) {
        const eos = levels[level];
        if (!eos || eos.length === 0) continue;

        hasAny = true;
        html += `<fieldset class="es-and-os-group">`;
        html += `<legend class="es-and-os-organiser">${organiser}</legend>`;
        for (const eo of eos) {
            const escapedText = eo.text.replace(/"/g, '&quot;');
            html += `<label class="es-and-os-item">`;
            html += `<input type="checkbox" class="es-and-os-checkbox" value="${eo.code}" data-text="${escapedText}">`;
            html += `<span class="es-and-os-code">${eo.code}</span>`;
            html += `<span class="es-and-os-text">${eo.text}</span>`;
            html += `</label>`;
        }
        html += `</fieldset>`;
    }

    if (!hasAny) {
        container.innerHTML = '<p class="es-and-os-hint">No Experiences &amp; Outcomes found for this level in this curriculum area.</p>';
        return;
    }

    container.innerHTML = html;

    // Attach change listeners to checkboxes
    container.querySelectorAll('.es-and-os-checkbox').forEach(cb => {
        cb.addEventListener('change', updatePreview);
    });
}

function getSelectedEsAndOs() {
    const container = document.getElementById('es-and-os-container');
    if (!container) return '';

    const checked = container.querySelectorAll('.es-and-os-checkbox:checked');
    if (checked.length === 0) return '';

    return Array.from(checked).map(cb => {
        return `${cb.value}: ${cb.dataset.text}`;
    }).join('\n');
}

/* ===== 3. Template Engine & Live Preview ===== */

function getFormValues() {
    const values = {};
    $form.querySelectorAll('[data-field-id]').forEach(el => {
        values[el.dataset.fieldId] = el.value.trim();
    });

    // Inject selected Es & Os into the es_and_os value
    const esAndOs = getSelectedEsAndOs();
    if (esAndOs) {
        values['es_and_os'] = esAndOs;
    }

    return values;
}

function renderTemplate(template, values) {
    let result = template;

    // 1. Handle conditional blocks: {{#fieldId}}...content...{{/fieldId}}
    result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, fieldId, content) => {
        if (!values[fieldId]) return '';
        return content.replace(/\{\{(\w+)\}\}/g, (__, innerField) => {
            return values[innerField] || `[${innerField}]`;
        });
    });

    // 2. Handle simple placeholders: {{fieldId}}
    result = result.replace(/\{\{(\w+)\}\}/g, (_, fieldId) => {
        return values[fieldId] || `[${fieldId}]`;
    });

    // 3. Clean up
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.split('\n').map(line => line.trimEnd()).join('\n');
    result = result.trim();

    return result;
}

function updatePreview() {
    const values = getFormValues();
    const hasContent = Object.values(values).some(v => v !== '');

    if (!hasContent) {
        $preview.textContent = 'Fill in the form to generate your prompt...';
        $copyBtn.disabled = true;
        return;
    }

    const rendered = renderTemplate(STATE.current.template, values);
    $preview.textContent = rendered;
    $copyBtn.disabled = false;
}

/* ===== 4. Copy to Clipboard ===== */

$copyBtn.addEventListener('click', async () => {
    const text = $preview.textContent;
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }

    $copyConfirm.hidden = false;
    setTimeout(() => { $copyConfirm.hidden = true; }, 2000);
});

/* ===== 5. Navigation ===== */

$backBtn.addEventListener('click', () => {
    $wizard.hidden = true;
    $categories.hidden = false;
    $form.innerHTML = '';
    $preview.textContent = 'Fill in the form to generate your prompt...';
    $copyBtn.disabled = true;
    STATE.current = null;
});

/* ===== Init ===== */
loadCategories();
