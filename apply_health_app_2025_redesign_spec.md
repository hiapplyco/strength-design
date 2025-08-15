# Apply Health App — 2025 Redesign (Mobile)

**Goal:** Modernize the visual language and UX to feel premium (think Oura-level polish), calm, and fast—while making logging and discovery frictionless.

---

## 1) North Star & Principles
- **Calm performance:** dark-first UI, soft depth, restrained color, and fast perceived speed (skeletons, optimistic updates).
- **Personal, not generic:** adaptive accent color, name usage, time-aware suggestions, and contextual empty states.
- **Motion as meaning:** micro-interactions that confirm success (haptics + subtle springs), choreographed page transitions, and Lottie micro-illustrations for states.
- **Touch-first density:** large tap targets (≥48px), 8pt spacing grid, prominent thumb-reachable controls.
- **Trust:** privacy-first copy (“Processed on-device when possible”), granular sharing, and clear provenance for nutrition data (USDA badge).

---

## 2) Visual Language (2025-forward)
- **Theme:** Dark by default; Light as optional.
- **Accent:** Adaptive dynamic accent derived from wallpaper (iOS Dynamic Color / Android Material You) with curated presets.
- **Depth:** Glass surfaces (frosted/translucent backdrops) + soft shadows; avoid neon/glow overuse.
- **Typography:** Grotesk sans for headings (e.g., **Inter/Atkinson/Plus Jakarta**), humanist sans for body (e.g., **SF Pro/Roboto**). Bold display for key numbers.
- **Iconography:** Duotone outline icons (stroke 1.75–2px), rounded joints.
- **Charts:** Minimal, ring/sparkline visuals with gentle gradients; avoid cluttered legends.

### Core Tokens
- **Radii:** xs 8, sm 12, md 16, lg 20, xl 28, 2xl 40.
- **Blur (glass):** 22–28px on nav and modals; 12–16px for cards over imagery.
- **Shadows:** y=2/6/12; blur=8/18/28; opacity 12–18%.
- **Spacing:** 4, 8, 12, 16, 20, 24, 32, 40.

### Color Palettes (Dark)
- **Background** `#0A0B0D`  
- **Surface** `#111216`  
- **Glass Surface** `rgba(255,255,255,0.06)`  
- **Text Primary** `#F5F7FA`  
- **Text Secondary** `#A7AEBC`  
- **Border** `#22242B`  
- **Positive** `#34D399`  
- **Warning** `#F59E0B`  
- **Danger** `#F87171`  
- **Accents (presets):**  
  - **Ocean**: `#61BDF8 → #4C8EF7`  
  - **Forest**: `#4AD6B3 → #3BA986`  
  - **Sunrise**: `#FFB86B → #FF7E87`  
  - **Amethyst**: `#B69CFF → #7C6AF8`

### Type Scale
- **Display** 32/38, **Title** 24/28, **Headline** 20/24, **Body** 16/22, **Micro** 13/18, **Label** 12/16.

---

## 3) Navigation & Layout
- **Bottom Dock (glass)** with 5 tabs: **Home, Exercises, Nutrition, Plans, Coach**.  
  - Center action becomes a **floating pill** (glass) for **Log** with haptic pop.
- **Large Search** lives in a collapsible header on relevant screens (e.g., Nutrition) with voice and barcode scan.
- **System bars** inherit a subtle gradient from the accent.

---

## 4) Hero Components

### A) Collapsible App Bar (Nutrition)
- **Collapsed**: title + search icon; subtle gradient line.  
- **Expanded**: search field, smart chips carousel (Trending, Recent, Pantry, Goals), USDA badge.

**Search field**  
- Placeholder: *“Search 2M+ foods • try ‘chicken breast 6oz’”*  
- Affixes: **Mic** (voice), **Scan** (barcode), **Filters** (serving size, cooked/raw, brand).  
- Debounced typeahead with skeleton suggestions.

### B) Smart Chips
- Rounded 20px, elevated on selection.  
- Categories: **Protein**, **Meal Type**, **Recently Logged**, **Favorites**, **Grocery Brands**, **Pantry** (offline items).  
- Long-press to pin to header.

### C) Food Result Card (List)
- **Left**: 48px square thumb (brand/food icon).  
- **Center**: Name, secondary line (serving), **macro strip** (P/C/F in tiny pills).  
- **Right**: kcal prominent; **+** button opens **Quick Add** bottom sheet.

### D) Quick Add Sheet
- Stepper (grams/oz/cups) with presets, macros live-update, *Add & Close* sticky CTA.

### E) Empty/Offline States (Illustrated)
- Friendly Lottie with 3 smart suggestions (chips).  
- Primary CTAs: **Scan barcode**, **Add custom food**, **Search examples**.

---

## 5) Screen-by-Screen — Key Flows

### Nutrition Search (Redesign of screenshot)
**Header**  
- Replace solid orange with **ambient gradient** matching accent (e.g., Sunrise).  
- Add **USDA source chip** (tappable for info).

**Search**  
- Large rounded field with mic + scan; hint examples include quantity.  
- **Spell tolerance** (“Did you mean chicken breast?”) and server-aware fallback.

**Smart Suggestions row**  
- Chips: *Chicken breast*, *Thigh (skinless)*, *Ground chicken*, *Rotisserie*, *Tenders (grilled)*.

**Results List**  
- Cards with macro strip and quick-add.  
- Infinite list with **shimmer skeletons** while loading.

**Empty state (when truly no results)**  
- Title: **No results for “chicken”**  
- Sub: *Try a specific cut or serving. Examples:*  
- Chips: *“chicken breast 6oz”*, *“ground chicken 100g”*, *Scan barcode*, *Add custom food*.

**Error state (API down)**  
- Title: **We’re having trouble**  
- Sub: *Your items are safe. Try again or add custom food.*  
- CTA: **Add custom food** + **Retry**.

### Home (Snapshot)
- **Daily ring** (kcal + protein), **Next goal card**, **Recent log**, **Coach tip**.  
- Stacked cards with glass and ambient accent.

### Exercises
- **Programs carousel**, **Muscle map** toggle (front/back SVG), **Session resume** CTA.

### Plans
- Weekly plan cards with checkmarks, adherence sparkline.

### Coach (AI)
- Chat + **Quick actions** ("What’s a 40g protein breakfast?") + **Explain this food** (macros, micros, alternatives).

---

## 6) Micro-Interactions & Haptics
- **Tap**: light (UIImpactFeedbackStyle.light).  
- **Add to log**: medium + 120ms scale-up of the + button, confetti spark 400ms (subtle).  
- **Pull to refresh**: stretch + “snap” spring.

---

## 7) Accessibility & Internationalization
- Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text.  
- Fully Dynamic Type; minimum tappable 48×48.  
- Reduce Motion support (fade instead of spring).  
- VoiceOver/ TalkBack labels include macros (“Chicken breast, 6 ounces, 276 kilocalories”).

---

## 8) Implementation Notes
- **iOS (SwiftUI)**: Material.thick for glass, SF Symbols, CoreHaptics, Live Activity for active timers (e.g., fasting/exercise).
- **Android (Compose)**: Material 3 dynamic color, Scrim/Glass container, haptics via VibrationEffect.
- **Caching**: local mirror of common foods; offline logging; background revalidation.
- **Search**: client hinting + server typeahead; fuzzy matching; synonyms (“chx → chicken”).

---

## 9) Copy & Tone
- Friendly, precise, never infantilizing.  
- Examples:  
  - Empty: **“No results for ‘chicken’. Try a cut or serving.”**  
  - Success toast: **“Added 6oz to today.”**  
  - Privacy: **“We only send what’s needed to find food data.”**

---

## 10) Dev-Ready Tokens (JSON sample)
```json
{
  "color": {
    "bg": "#0A0B0D",
    "surface": "#111216",
    "text": {"primary": "#F5F7FA", "secondary": "#A7AEBC"},
    "border": "#22242B",
    "accentGradient": ["#FFB86B", "#FF7E87"],
    "positive": "#34D399", "warning": "#F59E0B", "danger": "#F87171"
  },
  "radius": {"xs":8, "sm":12, "md":16, "lg":20, "xl":28, "xxl":40},
  "spacing": [4,8,12,16,20,24,32,40],
  "blur": {"glassNav":24, "glassCard":16},
  "elevation": {"card": {"y":6, "blur":18, "opacity":0.16}},
  "type": {"display":32, "title":24, "headline":20, "body":16, "micro":13}
}
```

---

## 11) What to Build First (MVP polish)
1. **Bottom glass dock** with center Log action + accent gradient.
2. **Nutrition Search** header (collapsible) + smart chips + typeahead.
3. **Food result card** + Quick Add bottom sheet with live macros.
4. **Empty/Error states** with Lottie micro-illustrations.
5. **Skeletons + optimistic logging** for speed.

---

## 12) Before/After Notes (from your screenshot)
- **Replace solid orange bar** with subtle accent gradient; keep brand warmth via Sunrise preset.  
- **Integrate mic + scan** in search; offer example queries with portions.  
- **Upgrade suggestions** to smart chips; ensure horizontal scroll and pinning.  
- **Meaningful empty state** with actions (Scan, Add custom food) instead of dead end.  
- **Card-driven results** with quick-add; kcal emphasized; macros visible at a glance.  
- **Glass dock nav** improves perceived depth and modernity.

---

## 13) Optional Enhancements
- **Live Activities / Widgets** for daily ring and quick-add.  
- **Pantry camera**: on-device OCR to add label items.  
- **“Swap for”** in Quick Add (healthier alternatives).  
- **Coach explanations**: why macros matter, sourced from USDA.

---

## 14) Asset Checklist
- Icon set (duotone), Lottie files (empty/error/success), accent gradient presets, USDA badge, barcode scan overlay, smart chip states (default/selected/disabled), skeleton components.

---

**Outcome:** A calmer, premium, and fast-feeling app that matches 2025 health design standards and invites daily use—without overwhelming users.

