# GEMINI.md — Strength.Design Gemini CLI Profile
> Version 1.0 • Updated 2025-01-17  
> Load with `gemini --context AGENTS.md --context GEMINI.md --context docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`

Gemini CLI thrives when it has crisp guardrails and references. This file captures the context, workflows, and expectations specific to Gemini when operating inside the Strength.Design monorepo.

---

## 1. Boot Instructions
1. Ensure `.gemini/settings.json` (if used) lists `AGENTS.md`, `GEMINI.md`, and `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md` under `contextFiles`.
2. Start every task with `gemini --plan` to outline steps; keep the plan synced with actual progress.
3. Use `--explain` after complex commands to summarize results instead of dumping full logs.

---

## 2. Shared Knowledge
- **Single source of truth**: [`docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`](docs/MOBILE_DEPLOYMENT_PLAYBOOK.md)
- **Primary surfaces**
  - Web (React/Vite): `src/`
  - Mobile (Expo RN): `mobile/`
  - Firebase Functions: `functions/`
  - Knowledge pipeline: `knowledge-pipeline/`
- **Agent roster**: see [`AGENTS.md`](AGENTS.md) for Claude & Codex cross-references.

---

## 3. Gemini-Specific Guidance
- **Tree-of-Thought**: respond with numbered reasoning (“Hypothesis”, “Checks”, “Action”) before making changes.
- **Command hygiene**: prefer `rg`, `fd`, `jq`, `tsc --noEmit`, and `expo` commands; avoid noisy `ls -R`.
- **Patch edits**: use `apply_patch` for deterministic diffs; mention when running generators/formatters.
- **Artifacts**: when uploading snippets, trim to the relevant function/component to conserve tokens.
- **Error surfaces**: if a command fails, re-run with `--explain` to capture short diagnostics.

---

## 4. Quick Command Palette
```bash
# Root
npm install
npm run dev
npm run build

# Mobile
cd mobile && npm install
npm run ios | npm run android | npm run web

# Firebase Functions
cd functions && npm install && npm run build
firebase emulators:start
firebase deploy --only functions
```
When searching: `rg "token" src/` or `rg --files mobile | head`.

---

## 5. Workflow Hooks
### Web
- Keep imports path-alias friendly (`@/components`, `@/lib`).
- Reuse shared services in `src/lib/services` to avoid duplicate logic.
- Respect Tailwind tokens from `components.json`.

### Mobile
- Screens in `mobile/screens`, business logic in `mobile/services`.
- AsyncStorage caches follow TTL patterns documented in `contextAggregator`.
- Use Expo’s managed workflow; avoid ejecting.

### Firebase Functions
- Secrets via `defineSecret` (see `functions/src/ai/*.ts`).
- Export new handlers in `functions/src/index.ts`.
- Run `npm run build` before `firebase deploy`.

---

## 6. Testing & Validation
- Prefer incremental checks: `npm run lint`, `tsc --noEmit`, `npm run test path`.
- For Expo commands you cannot run (e.g., `eas build`), describe the expected steps and why they’re skipped.
- Note emulator or credential requirements explicitly.

---

## 7. Response Structure
1. **Summary** – what changed and why.
2. **Details** – bullet list referencing files (`path:line`).
3. **Verification** – commands/tests executed.
4. **Follow-ups** – optional, only if necessary.

---

## 8. Safety
- Never commit secrets or modify `.env` with real keys.
- Avoid destructive Git commands (`reset --hard`, `clean -fd`).
- If repo state seems inconsistent, pause and ask for guidance.

With these guardrails, Gemini CLI can stay fast while respecting Strength.Design’s production standards.***
