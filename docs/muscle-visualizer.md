For the exercise search: Dynamic Muscle Group Visualization Component (MCP-style Tech Spec)

Inspired by the “21st.dev Magic MCP” approach—componentized, automation-friendly, and testable by default. This doc is the source of truth for building, validating, and shipping a reusable muscle-highlight component across web (React) and mobile (React Native).

⸻

TL;DR
•Goal: Given an exercise with muscleGroups: string[], render anterior/posterior anatomy SVGs and highlight the matching muscle paths.
•Assets: Two master SVGs (anterior-body.svg, posterior-body.svg) with one path/group per muscle and stable IDs (e.g., abdominals, chest, triceps, hamstrings).
•API: <MuscleVisualizer muscleGroups={['chest','triceps']} view="auto" />
•Highlighting: Fast, DOM-less updates via an injected <style> selector map: #chest, #triceps { fill: var(--mv-highlight); }
•DX: Scripts generate a canonical muscle registry, validate IDs, and produce type-safe enums—MCP vibes (automation first).

⸻

1) Architecture Overview

apps/
  web/
    src/components/MuscleVisualizer/
      MuscleVisualizer.tsx
      anatomy/
        anterior-body.svg
        posterior-body.svg
      registry/
        muscles.generated.json
        muscles.generated.ts        // type-safe IDs enum
      styles.css
    src/screens/ExerciseDetail.tsx
  mobile/
    src/components/MuscleVisualizerNative/
      MuscleVisualizerNative.tsx
      anatomy/ (RN-safe SVGs)
      registry/ (shared from pkg)
packages/
  muscle-anatomy-tools/             // node scripts, validation, CI tasks
    scripts/
      extract-ids.ts
      validate-ids.ts
      generate-registry.ts
      build-sprites.ts (optional)
    README.md

Key ideas (inspired by 21st.dev Magic MCP):
•Composable: Assets + registry + component are separable; you can swap new anatomy packs later.
•Automated: Scripts generate typed registries from SVGs; CI fails if IDs drift.
•Non-intrusive rendering: Styling muscles through CSS selectors avoids heavy DOM mutation.

⸻

2) Assets & Authoring Guidelines

Master SVGs (one-time setup)
•anterior-body.svg and posterior-body.svg
•Each muscle (or muscle group) must be a discrete element with a stable id.
•Prefer grouping muscles with <g id="quadriceps"> ... </g> rather than many anonymous paths.
•If you need sub-parts, nest them under a single group id.

Example (snippet):

<svg viewBox="0 0 1024 2048" xmlns="http://www.w3.org/2000/svg">
  <g id="abdominals">
    <path d="M ... Z" />
    <path d="M ... Z" />
  </g>
  <g id="chest">
    <path d="M ... Z" />
  </g>
  <g id="shoulders-anterior">
    <path d="M ... Z" />
  </g>
</svg>

ID Naming Conventions
•kebab-case, ASCII only, descriptive:
•abdominals, chest, triceps, biceps, forearms, obliques, hip-flexors
•quadriceps, hamstrings, glutes, calves
•shoulders-anterior, shoulders-posterior, lats, trapezius, erectors
•Keep names consistent across data, assets, and code.

Export Tips (Figma/Illustrator)
•Expand strokes where needed; avoid filters that rasterize.
•Remove transforms (flatten where possible) so path coordinates align between files.
•Prefer grouping under semantic <g id="..."> instead of many sibling paths.

⸻

3) Data Contract

Exercise Object (JSON)

{
  "id": "ex042",
  "name": "Barbell Bench Press",
  "equipment": "barbell",
  "muscleGroups": ["chest", "shoulders-anterior", "triceps"]
}

JSON Schema

{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/exercise.json",
  "type": "object",
  "required": ["id", "name", "muscleGroups"],
  "properties": {
    "id": { "type": "string", "minLength": 1 },
    "name": { "type": "string", "minLength": 1 },
    "equipment": { "type": ["string", "null"] },
    "muscleGroups": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "minItems": 1
    }
  },
  "additionalProperties": true
}

Contract rule: muscleGroups[] must exactly match SVG path/group IDs.

⸻

4) Component API (Web)

type MuscleId =  // generated from assets, example subset:
  | 'abdominals' | 'chest' | 'triceps' | 'biceps' | 'forearms'
  | 'obliques' | 'hip-flexors' | 'quadriceps' | 'hamstrings'
  | 'glutes' | 'calves' | 'shoulders-anterior' | 'shoulders-posterior'
  | 'lats' | 'trapezius' | 'erectors';

type ViewMode = 'anterior' | 'posterior' | 'auto' | 'split';

type IntensityMap = Partial<Record<MuscleId, 0|1|2|3>>;

interface MuscleVisualizerProps {
  muscleGroups: MuscleId[];
  view?: ViewMode;                 // default: 'auto'
  intensity?: IntensityMap;        // optional 0-3 tints
  highlightColor?: string;         // CSS color, default: hsl(340 85% 63%)
  inactiveColor?: string;          // default: hsl(0 0% 90%)
  showLabels?: boolean;            // overlay readable labels
  interactive?: boolean;           // allow hover/focus
  synonyms?: Record<string, MuscleId>; // map 'pecs' -> 'chest', etc.
  className?: string;
  style?: React.CSSProperties;
  onSelectMuscle?: (id: MuscleId) => void;
}

View behavior:
•auto: decide by where IDs exist; if both, render split.
•split: show front and back side by side.
•anterior/posterior: force a single view.

⸻

5) Rendering Strategy (Fast & Clean)
•Import SVGs as React components (SVGR).
•Compute a style tag string that targets matching IDs:

/* Example output */
#chest, #triceps { fill: var(--mv-highlight); stroke: currentColor; }

•Insert one <style> per render with CSS variables for colors; no manual DOM querying needed.

⸻

6) Implementation (React, Web)

Dependencies
• @svgr/webpack (or CRA/Vite SVGR defaults)
•TypeScript recommended

MuscleVisualizer.tsx

import React, { useMemo } from 'react';
import AnteriorSVG from './anatomy/anterior-body.svg?react';
import PosteriorSVG from './anatomy/posterior-body.svg?react';
import { resolveView, normalizeIds, buildRuleSets } from './utils';
import './styles.css';

export const DEFAULT_HIGHLIGHT = 'hsl(340 85% 63%)';
export const DEFAULT_INACTIVE  = 'hsl(0 0% 90%)';

export default function MuscleVisualizer({
  muscleGroups,
  view = 'auto',
  intensity,
  highlightColor = DEFAULT_HIGHLIGHT,
  inactiveColor = DEFAULT_INACTIVE,
  showLabels = false,
  interactive = false,
  synonyms,
  className,
  style,
  onSelectMuscle
}: MuscleVisualizerProps) {

  const ids = useMemo(
    () => normalizeIds(muscleGroups, synonyms),
    [muscleGroups, synonyms]
  );

  const { showAnterior, showPosterior } = useMemo(
    () => resolveView(ids, view),
    [ids, view]
  );

  const css = useMemo(
    () => buildRuleSets(ids, intensity),
    [ids, intensity]
  );

  const rootStyle: React.CSSProperties = {
    // make colors themeable without re-computation
    ['--mv-highlight' as any]: highlightColor,
    ['--mv-inactive' as any]: inactiveColor,
    ...style
  };

  const handleClick = (e: React.MouseEvent<SVGElement>) => {
    if (!interactive || !onSelectMuscle) return;
    const el = e.target as SVGElement;
    const candidate = el.closest('[id]') as SVGElement | null;
    const id = candidate?.id as string | undefined;
    if (id && ids.includes(id as any)) onSelectMuscle(id as any);
  };

  return (
    <div className={`mv-root ${className ?? ''}`} style={rootStyle}>
      <style>{css}</style>

      <div className={`mv-canvas ${showPosterior ? 'mv-split' : ''}`}>
        {showAnterior && (
          <div className="mv-pane" aria-label="Anterior view">
            <AnteriorSVG className="mv-svg" onClick={handleClick} />
            {showLabels && <Labels forView="anterior" activeIds={ids} />}
          </div>
        )}
        {showPosterior && (
          <div className="mv-pane" aria-label="Posterior view">
            <PosteriorSVG className="mv-svg" onClick={handleClick} />
            {showLabels && <Labels forView="posterior" activeIds={ids} />}
          </div>
        )}
      </div>
    </div>
  );
}

// Basic label overlay, optional (implementation left concise for brevity)
function Labels({ forView, activeIds }: { forView: 'anterior'|'posterior'; activeIds: string[] }) {
  return <div className="mv-label-layer" data-view={forView} />;
}

utils.ts

import MUSCLES from './registry/muscles.generated.json';

export function normalizeIds(muscleGroups: string[], synonyms?: Record<string, string>) {
  const map = new Map<string, string>(
    Object.entries(synonyms ?? {}).map(([k, v]) => [k.toLowerCase(), v])
  );
  return Array.from(new Set(
    muscleGroups
      .map(x => x.trim().toLowerCase())
      .map(x => map.get(x) ?? x)
      .filter(x => MUSCLES.all.includes(x))
  )) as any;
}

export function resolveView(ids: string[], view: 'auto'|'split'|'anterior'|'posterior') {
  if (view === 'anterior') return { showAnterior: true, showPosterior: false };
  if (view === 'posterior') return { showAnterior: false, showPosterior: true };
  if (view === 'split')     return { showAnterior: true, showPosterior: true };

  const hasAnt = ids.some(id => MUSCLES.anterior.includes(id));
  const hasPost= ids.some(id => MUSCLES.posterior.includes(id));
  return { showAnterior: hasAnt || !hasPost, showPosterior: hasPost };
}

export function buildRuleSets(ids: string[], intensity?: Partial<Record<string, 0|1|2|3>>) {
  const base =
    `svg [id] { fill: var(--mv-inactive); transition: fill 200ms ease; }`;

  if (!ids.length) return base;

  // Intensity -> alpha multiplier
  const alpha = (lvl?: 0|1|2|3) =>
    ({0: '0.35', 1: '0.55', 2: '0.75', 3: '1'}[lvl ?? 3]);

  const buckets: Record<string, string[]> = {};
  for (const id of ids) {
    const a = alpha(intensity?.[id as any]);
    buckets[a] ||= [];
    buckets[a].push(`#${id}`);
  }

  const rules = Object.entries(buckets)
    .map(([a, sels]) => `${sels.join(', ')} { fill: color-mix(in srgb, var(--mv-highlight) ${parseFloat(a)*100}%, transparent); }`)
    .join('\n');

  return `${base}\n${rules}`;
}

styles.css

.mv-root { display: grid; gap: 1rem; }
.mv-canvas { display: grid; grid-template-columns: 1fr; }
.mv-canvas.mv-split { grid-template-columns: 1fr 1fr; gap: 2rem; }
.mv-pane { position: relative; }
.mv-svg { width: 100%; height: auto; display: block; }
.mv-label-layer { position: absolute; inset: 0; pointer-events: none; }

Example usage

import MuscleVisualizer from ' @/components/MuscleVisualizer';

export function ExerciseDetail({ exercise }: { exercise: { muscleGroups: string[] } }) {
  return (
    <section>
      <h2>Target Muscles</h2>
      <MuscleVisualizer
        muscleGroups={exercise.muscleGroups}
        view="auto"
        intensity={{ chest: 3, 'shoulders-anterior': 2, triceps: 2 }}
        interactive
        synonyms={{ pecs: 'chest' }}
        onSelectMuscle={(id) => console.log('Selected:', id)}
      />
    </section>
  );
}


⸻

7) React Native Variant

Why different? React Native uses react-native-svg. Use react-native-svg-transformer to import SVG as components.

Setup
•yarn add react-native-svg react-native-svg-transformer
•metro.config.js configure transformer
•Use anatomy SVGs that avoid unsupported filters.

MuscleVisualizerNative.tsx (shape mirrors web)

import React, { useMemo } from 'react';
import { View } from 'react-native';
import AnteriorSVG from './anatomy/anterior-body.svg';
import PosteriorSVG from './anatomy/posterior-body.svg';
import { normalizeIds, resolveView } from '../shared/utils';
import MUSCLES from '../shared/registry/muscles.generated.json';

type Props = {
  muscleGroups: string[];
  view?: 'auto'|'split'|'anterior'|'posterior';
  highlightColor?: string;
  inactiveColor?: string;
};

export default function MuscleVisualizerNative({
  muscleGroups,
  view = 'auto',
  highlightColor = '#ff4da6',
  inactiveColor = '#e5e5e5'
}: Props) {
  const ids = useMemo(() => normalizeIds(muscleGroups), [muscleGroups]);
  const { showAnterior, showPosterior } = useMemo(() => resolveView(ids, view), [ids, view]);

  // RN doesn't support CSS selectors; pass color props into elements.
  // Author SVGs with data attributes or use a build step to map ids -> props.
  // Here we rely on a generated prop-injection wrapper (see tools section).
  const inject = (SvgComp: any) => (
    <SvgComp
      // @ts-expect-error: generated components accept per-id fill props
      __fills={Object.fromEntries(ids.map(id => [id, highlightColor]))}
      __defaultFill={inactiveColor}
    />
  );

  return (
    <View style={{ gap: 16, flexDirection: showPosterior ? 'row' : 'column' }}>
      {showAnterior && inject(AnteriorSVG)}
      {showPosterior && inject(PosteriorSVG)}
    </View>
  );
}

Note: For RN, add a small codegen step that transforms id="chest" into a prop-controllable group (e.g., SVGR template that reads a __fills map and sets fill on matching nodes).

⸻

8) Tooling & Codegen (Automation First)

Channeling the 21st.dev Magic MCP ethos—push chores into scripts.

extract-ids.ts
•Parse both SVGs, collect all unique ids (only on semantic groups).
•Output muscles.generated.json:

{
  "all": ["abdominals","chest","triceps", "..."],
  "anterior": ["abdominals","chest","..."],
  "posterior": ["triceps","lats","..."]
}

generate-registry.ts
•Produce muscles.generated.ts:

export const MUSCLES = ["abdominals","chest","triceps"] as const;
export type MuscleId = typeof MUSCLES[number];

validate-ids.ts (CI gate)
•Fail build if:
•Duplicate IDs, empty groups, or mismatched presence between anterior/posterior when expected.
•Non-canonical casing or illegal chars.

Optional: build-sprites.ts
•Create a single sprite sheet or inlined symbol map for SSR portability (web).

NPM Scripts

{
  "scripts": {
    "anatomy:extract": "ts-node scripts/extract-ids.ts",
    "anatomy:gen": "ts-node scripts/generate-registry.ts",
    "anatomy:validate": "ts-node scripts/validate-ids.ts",
    "anatomy:all": "yarn anatomy:extract && yarn anatomy:gen && yarn anatomy:validate"
  }
}


⸻

9) Accessibility
•The visual is decorative by default; provide text equivalents on the screen:
•<figure aria-labelledby="mv-title">...</figure>
•aria-describedby references to a list of targeted muscles.
•Focus states if interactive=true: add tabIndex={0} to groups and aria-pressed when toggled.

⸻

10) Theming & Styling
•Colors controlled by CSS variables:
•--mv-highlight, --mv-inactive
•Consumers may override at container scope:

.exercise--push-day {
  --mv-highlight: hsl(12 90% 55%);
  --mv-inactive: hsl(0 0% 92%);
}


⸻

11) Performance Notes
•CSS selector injection avoids per-path mutations.
•SVGs are static; memoize them (SVGR components are cheap).
•For many instances on one page, share a global stylesheet string to prevent duplicate <style> tags.

⸻

12) Error Handling
•Unknown IDs are ignored and logged in dev only.
•Empty muscleGroups → render base anatomy with inactive fill only.
•If required IDs are missing from assets (regression), validate-ids.ts fails CI.

⸻

13) Testing
•Unit: utilities (normalizeIds, resolveView, buildRuleSets).
•Visual regression: Storybook + Chromatic:
•Stories for common exercises (bench, squat, deadlift).
•Snapshots ensure highlight selectors remain stable.
•E2E: Cypress test verifies that selecting a chip toggles #quadriceps rule presence.

⸻

14) Example Stories (Storybook)

export const BenchPress = () => (
  <MuscleVisualizer muscleGroups={['chest','shoulders-anterior','triceps']} />
);

export const BackSquat = () => (
  <MuscleVisualizer muscleGroups={['quadriceps','glutes','hamstrings','erectors']} view="split" />
);


⸻

15) Minimal Muscle ID Starter Set

Extend as needed; ensure IDs exist in both SVGs.

•Anterior: abdominals, obliques, chest, shoulders-anterior, biceps, forearms, hip-flexors, quadriceps, tibialis-anterior
•Posterior: trapezius, shoulders-posterior, lats, erectors, triceps, forearms, glutes, hamstrings, calves

⸻

16) Security & Licensing
•Ensure anatomy SVGs are properly licensed (open source or purchased).
•No PII; no tracking in the component.
•Ship assets in your own CDN or bundle.

⸻

17) Integration Checklist
•Place anterior-body.svg and posterior-body.svg into anatomy/.
•Run yarn anatomy:all to generate registries and types.
•Import and render <MuscleVisualizer /> with exercise data.
•Add Storybook stories and snapshot tests.
•Wire synonyms (pecs → chest) if your data uses alternates.

⸻

18) Example Exercise Data (copy-paste)

[
  { "id": "ex007", "name": "3/4 Sit-Up", "equipment": "none", "muscleGroups": ["abdominals"] },
  { "id": "ex042", "name": "Barbell Bench Press", "equipment": "barbell", "muscleGroups": ["chest","shoulders-anterior","triceps"] },
  { "id": "ex103", "name": "Back Squat", "equipment": "barbell", "muscleGroups": ["quadriceps","glutes","hamstrings","erectors"] }
]


⸻

19) Future Enhancements
•Heatmaps: Map intensity to volume/load metrics and animate with a legend.
•Per-side targeting: Left/right asymmetry (duplicate IDs with -left/-right).
•Hover tooltips: Small muscle name chips.
•RN codegen: Fully automated prop injection for react-native-svg.

⸻

References & Inspiration
•21st.dev “Magic MCP”—AI-assisted, component-first development workflow.  ￼ ￼
•Model Context Protocol (MCP) overview and tooling concepts.  ￼

⸻

Done. This .md spec is ready to drop into your repo (e.g., docs/muscle-visualizer.md) and aligns with the MCP-style, automation-heavy dev workflow.
