# Educator Prompt Generator — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a browser-based prompt generator that helps Scottish education staff create well-structured AI prompts through a guided wizard interface.

**Architecture:** Single-page app with a data-driven template system. A JSON file defines all categories, form fields, and prompt templates. JavaScript reads the JSON, renders forms dynamically, and assembles prompts by replacing placeholders with user inputs. No build tools, no dependencies.

**Tech Stack:** Plain HTML5, CSS3, vanilla JavaScript (ES6+), JSON for template data.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `index.html`
- Create: `css/styles.css`
- Create: `js/app.js`
- Create: `js/templates.json`

**Step 1: Create index.html with basic structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prompt Builder for Educators</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <header>
        <h1>Prompt Builder for Educators</h1>
        <p class="subtitle">Create effective AI prompts for teaching, planning, and administration</p>
    </header>

    <main>
        <section id="categories" class="categories-grid">
            <!-- Category cards rendered by JS -->
        </section>

        <section id="wizard" class="wizard" hidden>
            <button id="back-btn" class="back-btn">&larr; Back to categories</button>
            <h2 id="wizard-title"></h2>
            <div class="wizard-layout">
                <form id="wizard-form" class="wizard-form">
                    <!-- Form fields rendered by JS -->
                </form>
                <div class="preview-panel">
                    <h3>Your Prompt</h3>
                    <pre id="prompt-preview" class="prompt-preview">Fill in the form to generate your prompt...</pre>
                    <button id="copy-btn" class="copy-btn" disabled>Copy to Clipboard</button>
                    <span id="copy-confirm" class="copy-confirm" hidden>Copied!</span>
                </div>
            </div>
        </section>
    </main>

    <footer>
        <p>Prompt Builder for Educators &mdash; Scottish Curriculum for Excellence</p>
    </footer>

    <script src="js/app.js" type="module"></script>
</body>
</html>
```

**Step 2: Create empty css/styles.css**

Create the file with a single comment: `/* Prompt Builder for Educators */`

**Step 3: Create minimal js/app.js**

```javascript
// Prompt Builder for Educators — Main Application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Prompt Builder loaded');
});
```

**Step 4: Create js/templates.json with empty array**

```json
{
    "categories": []
}
```

**Step 5: Verify in browser**

Open `index.html` in a browser. Should see the header text and empty main area. Console should show "Prompt Builder loaded".

**Step 6: Commit**

```bash
git add index.html css/styles.css js/app.js js/templates.json
git commit -m "feat: scaffold project structure with base HTML, CSS, JS, and JSON"
```

---

### Task 2: Templates JSON — Define All 13 Categories

**Files:**
- Modify: `js/templates.json`

**Step 1: Write the complete templates.json**

Each category object follows this structure:

```json
{
    "id": "lesson-planning",
    "name": "Lesson Planning",
    "description": "Create lesson plans aligned to CfE Experiences & Outcomes",
    "icon": "📝",
    "group": "Instruction & Planning",
    "fields": [
        {
            "id": "level",
            "label": "Curriculum Level",
            "type": "select",
            "required": true,
            "options": ["Early Level (Nursery – P1)", "First Level (P2 – P4)", "Second Level (P5 – P7)", "Third Level (S1 – S3)", "Fourth Level (S4 – S6)"]
        },
        {
            "id": "subject",
            "label": "CfE Curricular Area",
            "type": "select",
            "required": true,
            "options": ["Expressive Arts", "Health & Wellbeing", "Languages (Literacy & English)", "Languages (Gaelic)", "Languages (Modern Languages)", "Mathematics & Numeracy", "Religious & Moral Education", "Sciences", "Social Studies", "Technologies"]
        },
        {
            "id": "topic",
            "label": "Topic",
            "type": "text",
            "required": true,
            "placeholder": "e.g. Fractions, World War II, Forces of nature..."
        },
        {
            "id": "es_and_os",
            "label": "Experiences & Outcomes / Benchmarks (optional)",
            "type": "textarea",
            "required": false,
            "placeholder": "Paste specific Es & Os or Benchmarks if you have them"
        },
        {
            "id": "detail",
            "label": "Level of Detail",
            "type": "select",
            "required": true,
            "options": ["Brief outline", "Detailed plan with timings", "Comprehensive plan with resources and differentiation"]
        },
        {
            "id": "additional",
            "label": "Additional Considerations (optional)",
            "type": "textarea",
            "required": false,
            "placeholder": "e.g. Include ASN accommodations, outdoor learning, cross-curricular links..."
        }
    ],
    "template": "You are an experienced Scottish educator with deep knowledge of Curriculum for Excellence.\n\n**Task:** Create a {{detail}} for a lesson on {{topic}}.\n\n**Context:**\n- Curriculum level: {{level}}\n- CfE area: {{subject}}\n{{#es_and_os}}- Experiences & Outcomes / Benchmarks: {{es_and_os}}{{/es_and_os}}\n\n**Requirements:**\n- Align to the Scottish Curriculum for Excellence\n- Include clear learning intentions and success criteria\n- Structure with a clear beginning, middle, and end\n- Include suggested activities and resources\n\n**Format:** Provide a structured lesson plan with clear headings and timings where appropriate.\n\n{{#additional}}**Additional notes:** {{additional}}{{/additional}}"
}
```

Write ALL 13 categories following this pattern:

1. **Lesson Planning** (as above)
2. **Unit/Block Planning** — fields: level, subject, topic, duration (dropdown: 2 weeks/half term/full term), es_and_os, detail, additional. Template asks for a medium-term plan.
3. **Differentiation** — fields: level, subject, topic, learner_needs (multi-select or dropdown: ASN, EAL, gifted & talented, mixed ability), existing_content (textarea: paste existing plan/content), additional. Template asks to adapt content.
4. **Learning Activities** — fields: level, subject, topic, activity_type (dropdown: warm-up/starter, group task, discussion prompt, plenary/review, homework), duration (dropdown: 5 min, 10 min, 15 min, 20+ min), additional. Template asks for specific activity ideas.
5. **Assessment Creation** — fields: level, subject, topic, assessment_type (dropdown: formative check, quiz, end-of-topic test, peer assessment), num_questions (dropdown: 5, 10, 15, 20), difficulty (dropdown: accessible, moderate, challenging, mixed), additional. Template asks for assessment items.
6. **Rubrics & Success Criteria** — fields: level, subject, topic, rubric_type (dropdown: teacher marking scheme, pupil self-assessment, peer assessment checklist), scale (dropdown: 3-point, 4-point, 5-point), additional. Template asks for rubric/criteria.
7. **Feedback & Reporting** — fields: level, subject, report_type (dropdown: end-of-term report comment, formative feedback, parent evening notes), tone (dropdown: formal, supportive, celebratory), pupil_context (textarea), additional. Template asks for feedback/comments.
8. **Parent/Carer Communication** — fields: communication_type (dropdown: letter, email, newsletter, event invite), tone (dropdown: formal, friendly, urgent), topic (text), key_points (textarea), additional. Template asks for the communication piece.
9. **Reference & Recommendation** — fields: reference_for (dropdown: pupil — further education, pupil — employment, colleague — job application), qualities (textarea: key qualities to highlight), context (textarea), additional. Template asks for a reference letter.
10. **Policy & Procedures** — fields: policy_type (dropdown: school policy, classroom procedure, risk assessment, guidance document), topic (text), scope (dropdown: whole school, department, class level), additional. Template asks for a policy draft.
11. **Professional Development** — fields: pd_type (dropdown: PRD targets, reflective statement, GTCS Standard evidence, professional learning plan), gtcs_standard (dropdown: Professional Values and Personal Commitment, Professional Knowledge and Understanding, Professional Skills and Abilities), context (textarea), additional. Template asks for PD content.
12. **Data & Improvement** — fields: data_type (dropdown: attainment data analysis, improvement plan, self-evaluation, action plan), focus_area (text), context (textarea), additional. Template asks for analytical/planning content.
13. **General Purpose** — fields: role (text: "What role should the AI take?"), task (textarea: "What do you need?"), context (textarea: "Any background info?"), format (dropdown: bullet points, detailed narrative, table, step-by-step guide), additional. Freeform template.

**Step 2: Verify JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('js/templates.json','utf8')); console.log('Valid JSON')"`
Expected: "Valid JSON"

**Step 3: Commit**

```bash
git add js/templates.json
git commit -m "feat: add all 13 category templates with CfE-aligned fields"
```

---

### Task 3: Core JavaScript — Category Cards Rendering

**Files:**
- Modify: `js/app.js`

**Step 1: Write the template loading and category rendering**

```javascript
// Prompt Builder for Educators — Main Application

const STATE = {
    templates: null,
    currentCategory: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

async function loadTemplates() {
    const response = await fetch('js/templates.json');
    const data = await response.json();
    STATE.templates = data.categories;
}

function renderCategories() {
    const container = $('#categories');
    // Group by category group
    const groups = {};
    STATE.templates.forEach(cat => {
        if (!groups[cat.group]) groups[cat.group] = [];
        groups[cat.group].push(cat);
    });

    let html = '';
    for (const [groupName, cats] of Object.entries(groups)) {
        html += `<h3 class="group-heading">${groupName}</h3>`;
        html += '<div class="cards-row">';
        cats.forEach(cat => {
            html += `
                <button class="category-card" data-id="${cat.id}">
                    <span class="card-icon">${cat.icon}</span>
                    <span class="card-name">${cat.name}</span>
                    <span class="card-desc">${cat.description}</span>
                </button>
            `;
        });
        html += '</div>';
    }
    container.innerHTML = html;

    // Attach click handlers
    $$('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const catId = card.dataset.id;
            const category = STATE.templates.find(c => c.id === catId);
            showWizard(category);
        });
    });
}

function showWizard(category) {
    STATE.currentCategory = category;
    $('#categories').hidden = true;
    $('#wizard').hidden = false;
    $('#wizard-title').textContent = `${category.icon} ${category.name}`;
    renderForm(category);
    updatePreview();
}

function showCategories() {
    STATE.currentCategory = null;
    $('#wizard').hidden = true;
    $('#categories').hidden = false;
    $('#wizard-form').innerHTML = '';
    $('#prompt-preview').textContent = 'Fill in the form to generate your prompt...';
    $('#copy-btn').disabled = true;
}

// Placeholder functions for next tasks
function renderForm(category) {}
function updatePreview() {}

document.addEventListener('DOMContentLoaded', async () => {
    await loadTemplates();
    renderCategories();
    $('#back-btn').addEventListener('click', showCategories);
});
```

**Step 2: Verify in browser**

Open `index.html`. Should see category cards grouped under headings. Clicking a card should hide cards and show the wizard section (empty form for now). Back button should return to cards.

**Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: render category cards grouped by type with click navigation"
```

---

### Task 4: Core JavaScript — Dynamic Form Rendering

**Files:**
- Modify: `js/app.js`

**Step 1: Implement renderForm()**

Replace the placeholder `renderForm` function:

```javascript
function renderForm(category) {
    const form = $('#wizard-form');
    let html = '';

    category.fields.forEach(field => {
        const requiredMark = field.required ? ' <span class="required">*</span>' : '';
        html += `<div class="form-group">`;
        html += `<label for="field-${field.id}">${field.label}${requiredMark}</label>`;

        if (field.type === 'select') {
            html += `<select id="field-${field.id}" data-field-id="${field.id}" ${field.required ? 'required' : ''}>`;
            html += `<option value="">— Select —</option>`;
            field.options.forEach(opt => {
                html += `<option value="${opt}">${opt}</option>`;
            });
            html += `</select>`;
        } else if (field.type === 'textarea') {
            html += `<textarea id="field-${field.id}" data-field-id="${field.id}" rows="3" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}></textarea>`;
        } else {
            html += `<input type="text" id="field-${field.id}" data-field-id="${field.id}" placeholder="${field.placeholder || ''}" ${field.required ? 'required' : ''}>`;
        }

        html += `</div>`;
    });

    form.innerHTML = html;

    // Attach live update listeners
    form.querySelectorAll('select, input, textarea').forEach(el => {
        el.addEventListener('input', updatePreview);
        el.addEventListener('change', updatePreview);
    });
}
```

**Step 2: Verify in browser**

Click a category card. Form fields should appear matching that category's field definitions from templates.json. Dropdowns should have correct options. Labels should show required asterisks.

**Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: render dynamic form fields from template definitions"
```

---

### Task 5: Core JavaScript — Prompt Preview & Template Engine

**Files:**
- Modify: `js/app.js`

**Step 1: Implement updatePreview() with simple template engine**

Replace the placeholder `updatePreview` function:

```javascript
function getFormValues() {
    const values = {};
    $$('#wizard-form [data-field-id]').forEach(el => {
        values[el.dataset.fieldId] = el.value.trim();
    });
    return values;
}

function renderTemplate(template, values) {
    let result = template;

    // Handle conditional sections: {{#field}}content{{/field}}
    // Show section only if the field has a value
    result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, field, content) => {
        if (values[field]) {
            // Process any placeholders inside the conditional
            return content.replace(/\{\{(\w+)\}\}/g, (m, key) => values[key] || '');
        }
        return '';
    });

    // Handle simple placeholders: {{field}}
    result = result.replace(/\{\{(\w+)\}\}/g, (match, field) => {
        return values[field] || `[${field}]`;
    });

    // Clean up empty lines from removed conditionals
    result = result.replace(/\n{3,}/g, '\n\n').trim();

    return result;
}

function updatePreview() {
    const values = getFormValues();
    const category = STATE.currentCategory;

    if (!category) return;

    // Check if any required field is filled
    const hasContent = category.fields.some(f => values[f.id]);

    if (!hasContent) {
        $('#prompt-preview').textContent = 'Fill in the form to generate your prompt...';
        $('#copy-btn').disabled = true;
        return;
    }

    const prompt = renderTemplate(category.template, values);
    $('#prompt-preview').textContent = prompt;
    $('#copy-btn').disabled = false;
}
```

**Step 2: Verify in browser**

Click a category, fill in fields. The prompt preview should update live as you type/select. Conditional sections (like Es & Os) should only appear when that field has content. Empty fields should show `[fieldname]` placeholder.

**Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: implement template engine with conditional sections and live preview"
```

---

### Task 6: Core JavaScript — Copy to Clipboard

**Files:**
- Modify: `js/app.js`

**Step 1: Add copy functionality**

Add to the `DOMContentLoaded` event listener:

```javascript
$('#copy-btn').addEventListener('click', async () => {
    const text = $('#prompt-preview').textContent;
    try {
        await navigator.clipboard.writeText(text);
        const confirm = $('#copy-confirm');
        confirm.hidden = false;
        setTimeout(() => { confirm.hidden = true; }, 2000);
    } catch (err) {
        // Fallback for older browsers or non-HTTPS
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        const confirm = $('#copy-confirm');
        confirm.hidden = false;
        setTimeout(() => { confirm.hidden = true; }, 2000);
    }
});
```

**Step 2: Verify in browser**

Fill in a form, click "Copy to Clipboard". Paste into a text editor — should match the preview. "Copied!" confirmation should flash for 2 seconds.

**Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add copy-to-clipboard with fallback and confirmation"
```

---

### Task 7: CSS — Complete Styling

**Files:**
- Modify: `css/styles.css`

**Step 1: Write complete stylesheet**

```css
/* Prompt Builder for Educators */

/* ---- CSS Variables for easy branding ---- */
:root {
    --color-primary: #2563eb;
    --color-primary-hover: #1d4ed8;
    --color-bg: #f8fafc;
    --color-surface: #ffffff;
    --color-text: #1e293b;
    --color-text-muted: #64748b;
    --color-border: #e2e8f0;
    --color-accent: #10b981;
    --color-required: #ef4444;
    --font-main: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'Courier New', Courier, monospace;
    --radius: 8px;
    --shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
    --shadow-lg: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
    --max-width: 1100px;
}

/* ---- Reset & Base ---- */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: var(--font-main);
    color: var(--color-text);
    background: var(--color-bg);
    line-height: 1.6;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* ---- Header ---- */
header {
    background: var(--color-primary);
    color: white;
    padding: 2rem 1.5rem;
    text-align: center;
}

header h1 { font-size: 1.75rem; font-weight: 700; }
.subtitle { opacity: 0.9; margin-top: 0.25rem; font-size: 1rem; }

/* ---- Main ---- */
main {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 2rem 1.5rem;
    width: 100%;
    flex: 1;
}

/* ---- Category Cards ---- */
.group-heading {
    font-size: 1.1rem;
    color: var(--color-text-muted);
    margin: 1.5rem 0 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.85rem;
}

.group-heading:first-child { margin-top: 0; }

.cards-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
}

.category-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 1.25rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    cursor: pointer;
    text-align: left;
    font: inherit;
    box-shadow: var(--shadow);
    transition: box-shadow 0.15s, border-color 0.15s;
}

.category-card:hover {
    box-shadow: var(--shadow-lg);
    border-color: var(--color-primary);
}

.card-icon { font-size: 1.75rem; }
.card-name { font-weight: 600; font-size: 1rem; }
.card-desc { font-size: 0.85rem; color: var(--color-text-muted); }

/* ---- Wizard ---- */
.wizard { animation: fadeIn 0.2s ease; }

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.back-btn {
    background: none;
    border: none;
    color: var(--color-primary);
    font: inherit;
    font-size: 0.95rem;
    cursor: pointer;
    padding: 0.25rem 0;
    margin-bottom: 1rem;
}

.back-btn:hover { text-decoration: underline; }

#wizard-title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
}

.wizard-layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    align-items: start;
}

/* ---- Form ---- */
.wizard-form { display: flex; flex-direction: column; gap: 1.25rem; }

.form-group { display: flex; flex-direction: column; gap: 0.35rem; }

.form-group label {
    font-weight: 600;
    font-size: 0.9rem;
}

.required { color: var(--color-required); }

.form-group select,
.form-group input,
.form-group textarea {
    font: inherit;
    font-size: 0.95rem;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    background: var(--color-surface);
    color: var(--color-text);
    transition: border-color 0.15s;
}

.form-group select:focus,
.form-group input:focus,
.form-group textarea:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.form-group textarea { resize: vertical; }

/* ---- Preview Panel ---- */
.preview-panel {
    position: sticky;
    top: 1.5rem;
}

.preview-panel h3 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.85rem;
}

.prompt-preview {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius);
    padding: 1.25rem;
    font-family: var(--font-mono);
    font-size: 0.85rem;
    white-space: pre-wrap;
    word-wrap: break-word;
    max-height: 60vh;
    overflow-y: auto;
    line-height: 1.5;
    box-shadow: var(--shadow);
}

.copy-btn {
    margin-top: 1rem;
    width: 100%;
    padding: 0.75rem 1.5rem;
    background: var(--color-accent);
    color: white;
    border: none;
    border-radius: var(--radius);
    font: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
}

.copy-btn:hover:not(:disabled) { background: #059669; }
.copy-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.copy-confirm {
    display: inline-block;
    margin-top: 0.5rem;
    color: var(--color-accent);
    font-weight: 600;
    font-size: 0.9rem;
    text-align: center;
    width: 100%;
}

/* ---- Footer ---- */
footer {
    text-align: center;
    padding: 1.5rem;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    border-top: 1px solid var(--color-border);
    margin-top: auto;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
    .wizard-layout {
        grid-template-columns: 1fr;
    }

    .preview-panel {
        position: static;
    }

    .cards-row {
        grid-template-columns: 1fr;
    }

    header h1 { font-size: 1.35rem; }
}
```

**Step 2: Verify in browser**

Full visual check: header looks good, cards are in a grid, clicking a card shows side-by-side form + preview layout. Check mobile layout by resizing browser window — should stack vertically.

**Step 3: Commit**

```bash
git add css/styles.css
git commit -m "feat: add complete responsive stylesheet with CSS custom properties"
```

---

### Task 8: Polish & Edge Cases

**Files:**
- Modify: `js/app.js`
- Modify: `index.html`

**Step 1: Add keyboard accessibility to category cards**

In `renderCategories()`, the cards are already `<button>` elements so they get keyboard focus for free. Verify Tab + Enter works.

**Step 2: Add a "no JavaScript" fallback**

In `index.html`, add inside `<main>` before the categories section:

```html
<noscript>
    <p style="text-align:center; padding:2rem; color:#ef4444;">
        This tool requires JavaScript to be enabled in your browser.
    </p>
</noscript>
```

**Step 3: Handle empty template gracefully**

In `renderTemplate()`, after cleaning up empty lines, also trim trailing whitespace from each line:

```javascript
result = result.split('\n').map(line => line.trimEnd()).join('\n');
```

**Step 4: Verify everything end-to-end**

1. Open `index.html` in browser
2. Click each of the 13 categories and verify forms render correctly
3. Fill in fields and verify prompt preview updates live
4. Test copy-to-clipboard
5. Test back button returns to categories
6. Test on a narrow viewport (mobile)
7. Test keyboard navigation (Tab through cards, Enter to select)

**Step 5: Commit**

```bash
git add index.html js/app.js
git commit -m "feat: add accessibility improvements and edge case handling"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project scaffolding | index.html, css/, js/ |
| 2 | All 13 category templates in JSON | templates.json |
| 3 | Category card rendering with navigation | app.js |
| 4 | Dynamic form rendering from JSON | app.js |
| 5 | Template engine + live preview | app.js |
| 6 | Copy to clipboard | app.js |
| 7 | Complete responsive CSS | styles.css |
| 8 | Polish, accessibility, edge cases | all files |
