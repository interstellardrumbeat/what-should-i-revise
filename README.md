# Diagnostic Self-Assessment Tool - IB Chemistry

A simple tool for students to self-assess their knowledge of IB Chemistry topics and choose what to revise accordingly.

This version uses:

- HTML
- CSS
- JavaScript
- JSON question bank
- `localStorage` for temporary quiz state

## Current features

- Chemistry-only sample question bank
- Complete IB Chemistry syllabus
- Topic- and Subtopic-level selection
- Level filter: SL, HL, or all
- Questions per selected subtopic: 1, 2, or all
- One-question-at-a-time quiz flow
- Overall score
- Topic-by-topic and Subtopic-by-subtopic score breakdown
- Weakest-subtopic recommendation
- Answer review with explanations

## Project structure

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   └── chemistry.json
└── assets/
```

## How the syllabus selection works

The app reads every question from:

```text
data/chemistry.json
```

Then it automatically groups questions by:

```text
topic -> subtopic
```

Students can select:

- an entire topic, which selects all subtopics inside it
- only specific subtopics
- all topics/subtopics using the Select all button

## How to edit questions

No topics or subtopics are hardcoded in the HTML. Questions must be added  to `chemistry.json` using the same topic and subtopic names.

Each question uses this format:

```json
{
  "id": "chem-structure-1-1-001",
  "subject": "Chemistry",
  "syllabus": "IB Chemistry",
  "level": "SL",
  "topic": "Structure 1. Models of the particulate nature of matter",
  "subtopic": "Structure 1.1 - Introduction to the particulate nature of matter",
  "difficulty": "Sample",
  "question": "Which statement best describes the particulate model of matter?",
  "options": [
    "Matter is made of tiny particles in constant motion.",
    "Matter is continuous and has no empty spaces.",
    "Only gases are made of particles.",
    "Particles disappear during physical changes."
  ],
  "answer": 0,
  "explanation": "The particulate model treats matter as tiny particles with spaces between them and motion that depends on temperature."
}
```

IMPORTANT: `answer` is the zero-based index of the correct option.

So:

- `0` means the first option
- `1` means the second option
- `2` means the third option
- `3` means the fourth option

## Current sample question bank

The current `chemistry.json` contains one sample question for each of these IB Chemistry subtopics (official IB syllabus):

```text
Structure 1.1 - Introduction to the particulate nature of matter
Structure 1.2 - The nuclear atom
Structure 1.3 - Electron configurations
Structure 1.4 - Counting particles by mass: The mole
Structure 1.5 - Ideal gases

Structure 2.1 - The ionic model
Structure 2.2 - The covalent model
Structure 2.3 - The metallic model
Structure 2.4 - From models to materials

Structure 3.1 - The periodic table: Classification of elements
Structure 3.2 - Functional groups: Classification of organic compounds

Reactivity 1.1 - Measuring enthalpy change
Reactivity 1.2 - Energy cycles in reactions
Reactivity 1.3 - Energy from fuels
Reactivity 1.4 - Entropy and spontaneity (Additional higher level)

Reactivity 2.1 - How much? The amount of chemical change
Reactivity 2.2 - How fast? The rate of chemical change
Reactivity 2.3 - How far? The extent of chemical change

Reactivity 3.1 - Proton transfer reactions
Reactivity 3.2 - Electron transfer reactions
Reactivity 3.3 - Electron sharing reactions
Reactivity 3.4 - Electron-pair sharing reactions
```

## How to run locally

Because the app loads `data/chemistry.json` using `fetch`, some browsers may block it if you open `index.html` directly from your computer.

For local testing, run a simple local server from inside the project folder:

```bash
python -m http.server 8000
```

Then open in browser:

```text
http://localhost:8000
```

## Next improvements

Possible future features:

- [ ] Add actual questions (instead of samples)
- [ ] Add images handling for question with figures
- [ ] Add report export (PDF) or report email options
- [ ] Add better revision recommendation system
- [ ] Add a working booking link for tutoring session
- [ ] Add an embeddable iframe version
- [ ] Add IB Physics and more subjects
- [ ] Add subject selection
