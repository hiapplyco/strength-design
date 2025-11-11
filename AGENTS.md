# Strength.Design Agent Index
> Last updated: 2025-01-17 • Applies to Claude Code, Gemini CLI, and Codex (OpenAI) agents  
> Master project reference: [`docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`](docs/MOBILE_DEPLOYMENT_PLAYBOOK.md)

This document is the root Tree-of-Thought (ToT) map for every coding agent that touches the Strength.Design monorepo. Each agent has its own markdown profile with detailed conventions, but all of them should start here before running commands or editing files.

---

## 1. Core References (load in every session)
- **Deployment Playbook** – `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md` (single source of truth for architecture, workflows, and release gates)
- **Agent Guides**  
  - Claude Code: [`CLAUDE.md`](CLAUDE.md)  
  - Gemini CLI: [`GEMINI.md`](GEMINI.md)  
  - Codex CLI: [`CODEX.md`](CODEX.md)
- **Primary services** – Web app (`src/`), Mobile app (`mobile/`), Firebase Functions (`functions/`), Knowledge pipeline (`knowledge-pipeline/`)

---

## 2. Shared Command Palette
```bash
# Install root deps
npm install

# Web workspace
npm run dev            # Vite dev server
npm run build          # Production bundle

# Mobile workspace
cd mobile && npm install
npm run ios | npm run android | npm run web

# Firebase
firebase emulators:start
cd functions && npm run build && firebase deploy --only functions
```
_Always set `workdir` explicitly and prefer `bash -lc '<cmd>'` when running through CLI agents._

---

## 3. Tree-of-Thought Workflow (all agents)
1. **Orient** – Read the Deployment Playbook section relevant to the task (architecture, backend, readiness, etc.).  
2. **Plan** – Outline the steps you’ll take (Claude `/plan`, Gemini `--plan`, Codex plan tool) before writing code.  
3. **Execute** – Work in small, verifiable increments; reference service-specific sections in the playbook.  
4. **Validate** – Run targeted tests or lint commands; note anything you could not run.  
5. **Document** – Summarize changes and link to touched files in the final response.

---

## 4. Agent Roster

### Claude Code
- Documentation: [`CLAUDE.md`](CLAUDE.md)
- Launch checklist:
  1. Load `AGENTS.md` + `CLAUDE.md` via `/open`.
  2. Mount `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md` for deep context.
  3. Use `/plan` for multi-step work; keep shell output trimmed to what matters.
- Strengths: great at long-form reasoning, ToT exploration, migration work.

### Gemini CLI
- Documentation: [`GEMINI.md`](GEMINI.md)
- Launch checklist:
  1. Configure `.gemini/settings.json` (if present) to auto-include `AGENTS.md` and `GEMINI.md`.
  2. Use `--plan` or `--explain` flags to reason before touching files.
  3. Favor `rg`, `tsc --noEmit`, and `expo` commands for faster feedback.
- Strengths: fast shell execution, good at structured diffs, integrates with Google Cloud tooling.

### Codex (OpenAI CLI / Codex agent)
- Documentation: [`CODEX.md`](CODEX.md)
- Launch checklist:
  1. Load `AGENTS.md` + `CODEX.md` as context.
  2. Use the plan tool when work spans multiple files.
  3. Default to `apply_patch` for textual edits; never rewrite generated files without cause.
- Strengths: strong TypeScript/React generation, reliable refactors when given explicit guardrails.

---

## 5. Safety & Access Notes
- **Secrets**: Real keys live outside the repo. Never hard-code credentials; rely on `.env` templates and Firebase Secrets.
- **Dangerous commands**: Avoid `git reset --hard`, `rm -rf`, or global installs unless explicitly approved.
- **Large outputs**: Summarize test/build logs; keep responses focused on actionable data.

---

## 6. Need More Context?
- Architecture, readiness, and feature matrices now live exclusively in `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`.
- If a task seems ambiguous, add clarifying assumptions to your final answer or ask the user before proceeding.

Happy shipping!***
