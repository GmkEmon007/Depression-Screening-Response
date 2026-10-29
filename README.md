# VU Research — Warm Terracotta Sanctuary (Figma Auto-Layout Master)

> **Center for Interdisciplinary Research (CIR), Varendra University**  
> **Institutional Research Ethics Clearance:** `Protocol #VU/ERC/2026/042`  
> **Project:** *An Explainable Machine Learning Framework for Context-Aware Depression Screening and Personalized Student Support among University Students in Bangladesh*

---

## 🏛️ Overview

This project implements the **Warm Terracotta Sanctuary** UI/UX design (from Figma / Stitch Auto-Layout Master) into a responsive, accessible, and interactive web application using semantic **HTML5**, modern **CSS3**, and **vanilla JavaScript**.

The aesthetic combines the dignity of a peer-reviewed academic publication with the gentle, reassuring warmth of biophilic healthcare spaces.

---

## 📁 File Structure

```
final q/
├── index.html        # Complete questionnaire structure with bilingual Bengali & English typography
├── style.css         # Warm terracotta color system, pebble micro-interactions, animations, and modal styling
├── script.js         # Real-time PHQ-9 scoring engine, Web Audio soundscape, scroll-spy, and local storage
└── README.md         # Documentation and research protocol overview
```

---

## 🎨 Design System: Warm Terracotta & Linen

- **Terracotta & Sienna Accents (`#C2653E`, `#9A3412`, `#8A4500`):** Grounded earthy tones representing warmth and active focus.
- **Linen & Sandstone (`#FAF6F0`, `#F3EDE2`):** Low-strain, paper-like background plane that eliminates sterile white glare.
- **Deep Espresso (`#291E16`, `#1C140E`):** High-contrast typography for bilingual legibility.
- **Typography:**
  - `Fraunces` & `Noto Serif Bengali` for serene editorial titles and quotes.
  - `Outfit` & `Plus Jakarta Sans` for clean, readable form controls.
  - `Material Symbols Outlined` for nature and mindful iconography.

---

## 🧠 Clinical Modules & Instruments

1. **Module A — Demographic & Background Information (A1–A7):** Age, Height, Weight, Sex, University Type, Living Arrangements, and Academic Year/Semester.
2. **Module B — PHQ-9 Mindful Self-Inquiry (B1–B9):** Validated 9-item Patient Health Questionnaire scored dynamically from `0` to `27` with automatic clinical severity stratification:
   - `0–4`: Minimal (স্বাভাবিক / ন্যূনতম)
   - `5–9`: Mild (মৃদু বিষণ্ণতা)
   - `10–14`: Moderate (মাঝারি বিষণ্ণতা)
   - `15–19`: Moderately Severe (উচ্চ-মাঝারি বিষণ্ণতা)
   - `20–27`: Severe (তীব্র বিষণ্ণতা)
3. **Module C — Academic Rhythms & CGPA Anxiety (C1–C8):** 5-point Likert scale measuring workload, examination stress, and academic satisfaction.
4. **Module D — Future Horizons & AI Disruption (D1–D4):** Career certainty, economic anxiety, and perceptions of generative AI impact.
5. **Module E — Daily Rhythms & Vitality Habits (E1–E8):** Sleep schedules, physical exercise, screen time, nutrition, and health history.
6. **Module F — Multidimensional Scale of Perceived Social Support (MSPSS, F1–F12):** 7-point scale measuring support from Significant Others, Family, and Friends.
7. **Module G — Environmental & Financial Stressors (G1–G6):** Critical life events, family income, financial stress, and study environment conditions.

---

## ⚡ Interactive Features

- **Pebble Button Radios:** Soft tactile selection with active state styling, keyboard accessibility, and state toggling.
- **Real-Time PHQ-9 HUD:** Floating status badge in the bottom-right corner calculating and categorizing scores live as answers are selected.
- **Garden Waypoints & Scroll-Spy:** Interactive top progression bar highlighting active modules as the user scrolls.
- **Synthesized Ambient Soundscape:** Clickable courtyard rain soundscape generated via vanilla browser **Web Audio API** (432Hz filtered brown noise — zero external media required).
- **Pause & Save Zen Seed:** Preserves form answers in browser `localStorage` and restores them upon reloading.
- **Reflection Summary Modal:** Generates an anonymous cryptographic research token, summary scores, printable report view, JSON data export, and crisis helpline emergency contacts in Bangladesh (*Kaan Pete Roi: +8801779554391*, *333*).

---

## 🚀 How to Run

1. Open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).
2. Or serve locally with any HTTP server:
   ```powershell
   # Using Python:
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000`.
