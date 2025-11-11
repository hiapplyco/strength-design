# CODEX.md — Strength.Design Codex (OpenAI) Profile
> Version 1.0 • Updated 2025-01-17  
> Reference alongside [`AGENTS.md`](AGENTS.md) and [`docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`](docs/MOBILE_DEPLOYMENT_PLAYBOOK.md)

Codex (the CLI agent backing this session) should follow this guide to stay aligned with Strength.Design conventions.

---

## 1. Startup Checklist
1. Load `AGENTS.md`, `CODEX.md`, and `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md` into context.
2. Use the plan tool (required for multi-step tasks). Plans must be updated after each completed action.
3. Always set the `workdir` parameter in `shell` calls; avoid `cd` chaining inside commands unless necessary.

---

## 2. Key References
- **Master architecture + release**: `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`
- **Primary code zones**:
  - Web: `src/`
  - Mobile: `mobile/`
  - Firebase Functions: `functions/`
  - Knowledge pipeline: `knowledge-pipeline/`
- **Shared command palette**: see `AGENTS.md §2`.

---

## 3. Codex-Specific ToT Guidance
- **Reason out loud**: describe at least two options before editing when stakes are high (schema change, API surface, etc.).
- **Minimal diffs**: use `apply_patch` for textual edits; mention when generating larger files or running formatters.
- **Search first**: run `rg`/`fd` before modifying files to confirm existing patterns.
- **Cite files**: final responses must include `path:line` references for each modified file.

---

## 4. Common Workflows
### Web (React/Vite)
- TypeScript strict mode; prefer hooks + Zustand stores already in `src/stores`.
- Styling via Tailwind classes defined in `components.json`.
- For analytics, reuse helpers in `src/lib/analytics.ts`.

### Mobile (Expo)
- Keep services in `mobile/services`, screens in `mobile/screens`.
- Use AsyncStorage caches with documented TTL constants.
- For AI/pose features reference `aiService.js`, `formContextService.js`, and `poseDetection/`.

### Firebase Functions
- Node 20 runtime; functions live in `functions/src`.
- Add new exports to `functions/src/index.ts`.
- Wrap outbound calls with logging + error handling per production standards.

---

## 5. Testing & Validation
- Preferred commands: `npm run lint`, `npm run test <target>`, `tsc --noEmit`, `expo start --offline` (if accessible).
- If a test can’t be run (e.g., emulator-only), explain the limitation and what should be executed manually.

---

## 6. Safety Rules
- Do **not** alter secrets, `.env` files, or Firebase project IDs without explicit instruction.
- Avoid destructive Git commands (`reset --hard`, `clean`, `push --force`).
- If unexpected diffs appear, stop and ask the user how to proceed.

---

## 7. Response Template
1. **Outcome** – concise description of what changed.
2. **Details** – bullet list with `file:line` references.
3. **Validation** – commands/tests executed (or skipped with reason).
4. **Next steps** – optional and only when helpful.

Following this profile keeps Codex output predictable, auditable, and production-ready.***
