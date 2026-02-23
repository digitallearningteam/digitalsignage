# Prompt Generator for Educators — Design Document

**Date:** 2026-02-23
**Status:** Approved

## Overview

A browser-based prompt generator that helps Scottish education staff (teachers and central staff) create well-structured prompts for AI tools. The tool uses template-based prompt assembly — no AI model required. Users answer guided questions through a wizard interface, and the tool stitches their answers into a proven prompt structure they can copy into any AI tool.

## User Flow

1. **Landing** — Clean page with title and grid of category cards
2. **Category Select** — User clicks a card (e.g. "Lesson Planning"), wizard appears
3. **Wizard Steps** — 4-6 questions per category: dropdowns, text inputs, toggles
4. **Live Preview** — Prompt builds in real-time as fields are filled
5. **Copy** — "Copy to Clipboard" button, paste into preferred AI tool
6. **Start Over** — Reset to try a different category

Progressive disclosure: beginners get guided step-by-step, experienced users can scan and fill quickly.

## Scottish Curriculum Alignment

All terminology aligned to Curriculum for Excellence (CfE):

**Levels:**
- Early Level (Nursery – P1)
- First Level (P2 – P4)
- Second Level (P5 – P7)
- Third Level (S1 – S3)
- Fourth Level (S4 – S6)

**CfE Curricular Areas:**
- Expressive Arts
- Health & Wellbeing
- Languages (Literacy & English, Gaelic, Modern Languages)
- Mathematics & Numeracy
- Religious & Moral Education
- Sciences
- Social Studies
- Technologies

References use Experiences & Outcomes (Es & Os) and Benchmarks.

## Categories (13)

**Instruction & Planning:**
- Lesson Planning — Lesson plans aligned to CfE Es & Os
- Unit/Block Planning — Longer-term planning across a series of lessons
- Differentiation — Adapt content for different learner needs (ASN, EAL, gifted)
- Learning Activities — Warm-ups, group tasks, discussion prompts, plenary ideas

**Assessment:**
- Assessment Creation — Quizzes, tests, formative checks aligned to Benchmarks
- Rubrics & Success Criteria — Marking schemes, self/peer assessment tools
- Feedback & Reporting — Pupil report comments, feedback templates

**Communication:**
- Parent/Carer Communication — Letters, emails, newsletters
- Reference & Recommendation Letters — For pupils or colleagues
- Policy & Procedures — School policy drafts, guidance documents

**Professional & Admin:**
- Professional Development — PRD targets, reflective statements, GTCS Standard evidence
- Data & Improvement — Analysing attainment data, improvement plan writing
- General Purpose — Freeform "build your own prompt" with guided structure

## Prompt Template Structure

Every generated prompt follows this pattern:

```
You are an experienced Scottish educator. [Role context based on category]

**Task:** [What the user needs]

**Context:**
- Curriculum level: [Early/First/Second/Third/Fourth]
- CfE area: [Subject]
- Es & Os / Benchmarks: [If provided]
- Topic: [User's specific topic]

**Requirements:**
- [Category-specific requirements from form selections]

**Format:** [User's chosen output format]

**Additional notes:** [User's freeform text if any]
```

Prompt engineering principles baked in:
- Role setting (Scottish educator, not generic assistant)
- Structured sections (task, context, requirements, format)
- CfE-aligned terminology to prevent US/English curriculum defaults
- Format control for output verbosity

## Technical Architecture

```
prompter/
├── index.html          — Single page: landing + wizard + preview
├── css/
│   └── styles.css      — All styling, responsive (mobile-friendly)
├── js/
│   ├── app.js          — Navigation, form handling, preview updates
│   └── templates.json  — Category definitions, form fields, prompt templates
└── assets/
    └── icons/          — SVG or emoji icons for category cards
```

**How it works:**
1. `templates.json` defines everything data-driven: category metadata, form field definitions (type, label, options, placeholder, required/optional), and prompt template strings with `{{placeholders}}`
2. `app.js` reads JSON, renders category cards, builds forms dynamically, attaches live listeners, re-renders prompt preview on any change
3. No build step. Open `index.html` in a browser. Host anywhere.

**Adding a new category** = adding a new object to `templates.json`. No code changes needed.

## Visual Design

- Clean, professional look — light background, clear typography
- Category cards — grid with icon, title, one-line description
- Wizard form — clear labels, generous spacing, obvious required vs optional
- Prompt preview — distinct panel with live-updating assembled prompt
- Copy button — large, prominent, with "Copied!" confirmation
- Responsive — side-by-side on desktop, stacked on mobile
- Branding-neutral — easy to add logo/colours via CSS variables

## Constraints

- No AI model used in the tool itself
- No login, accounts, or cookies — stateless
- No build tools, no npm, no Node.js required
- Plain HTML/CSS/JS only
- Works offline (after initial load)
- Copy-to-clipboard output (AI-tool-agnostic)
