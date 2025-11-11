#!/bin/bash

echo "Initializing..."
echo ""
echo ""

echo " ██████╗ ██████╗██████╗ ███╗   ███╗"
echo "██╔════╝██╔════╝██╔══██╗████╗ ████║"
echo "██║     ██║     ██████╔╝██╔████╔██║"
echo "╚██████╗╚██████╗██║     ██║ ╚═╝ ██║"
echo " ╚═════╝ ╚═════╝╚═╝     ╚═╝     ╚═╝"

echo "┌─────────────────────────────────┐"
echo "│ Claude Code Project Management  │"
echo "│ by https://x.com/aroussi        │"
echo "└─────────────────────────────────┘"
echo "https://github.com/automazeio/ccpm"
echo ""
echo ""

echo "🚀 Initializing Claude Code PM System"
echo "======================================"
echo ""

# Check for required tools
echo "🔍 Checking dependencies..."

# Check gh CLI
if command -v gh &> /dev/null; then
  echo "  ✅ GitHub CLI (gh) installed"
else
  echo "  ❌ GitHub CLI (gh) not found"
  echo ""
  echo "  Installing gh..."
  if command -v brew &> /dev/null; then
    brew install gh
  elif command -v apt-get &> /dev/null; then
    sudo apt-get update && sudo apt-get install gh
  else
    echo "  Please install GitHub CLI manually: https://cli.github.com/"
    exit 1
  fi
fi

# Check gh auth status
echo ""
echo "🔐 Checking GitHub authentication..."
if gh auth status &> /dev/null; then
  echo "  ✅ GitHub authenticated"
else
  echo "  ⚠️ GitHub not authenticated"
  echo "  Running: gh auth login"
  gh auth login
fi

# Check for gh-sub-issue extension
echo ""
echo "📦 Checking gh extensions..."
if gh extension list | grep -q "yahsan2/gh-sub-issue"; then
  echo "  ✅ gh-sub-issue extension installed"
else
  echo "  📥 Installing gh-sub-issue extension..."
  gh extension install yahsan2/gh-sub-issue
fi

# Create directory structure
echo ""
echo "📁 Creating directory structure..."
mkdir -p .claude/prds
mkdir -p .claude/epics
mkdir -p .claude/rules
mkdir -p .claude/agents
mkdir -p .claude/scripts/pm
echo "  ✅ Directories created"

# Copy scripts if in main repo
if [ -d "scripts/pm" ] && [ ! "$(pwd)" = *"/.claude"* ]; then
  echo ""
  echo "📝 Copying PM scripts..."
  cp -r scripts/pm/* .claude/scripts/pm/
  chmod +x .claude/scripts/pm/*.sh
  echo "  ✅ Scripts copied and made executable"
fi

# Check for git
echo ""
echo "🔗 Checking Git configuration..."
if git rev-parse --git-dir > /dev/null 2>&1; then
  echo "  ✅ Git repository detected"

  # Check remote
  if git remote -v | grep -q origin; then
    remote_url=$(git remote get-url origin)
    echo "  ✅ Remote configured: $remote_url"
  else
    echo "  ⚠️ No remote configured"
    echo "  Add with: git remote add origin <url>"
  fi
else
  echo "  ⚠️ Not a git repository"
  echo "  Initialize with: git init"
fi

# Create CLAUDE.md if it doesn't exist
if [ ! -f "CLAUDE.md" ]; then
  echo ""
  echo "📄 Creating CLAUDE.md..."
cat > CLAUDE.md << 'EOF'
# CLAUDE.md — Strength.Design Claude Code Playbook
> Version 2.0 • Updated 2025-01-17  
> Pair with [`AGENTS.md`](AGENTS.md) and [`docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`](docs/MOBILE_DEPLOYMENT_PLAYBOOK.md)

This Tree-of-Thought (ToT) profile keeps Claude Code aligned with Strength.Design’s development standards. Load this file (and the deployment playbook) with `/open` at the start of every session.

---

## 1. Session Boot Sequence
1. `/open AGENTS.md` → repo map + shared commands  
2. `/open CLAUDE.md` → this file  
3. `/open docs/MOBILE_DEPLOYMENT_PLAYBOOK.md` → architecture + release checklist  
4. Run `/plan` for any work that spans more than one edit; keep steps actionable and update after each major sub-task.

---

## 2. Claude-Specific Best Practices
- **ToT mindset**: articulate “Observe → Plan → Act → Verify” in messages. When unsure, list at least 2 possible approaches before executing.
- **Shell discipline**: prefer `bash -lc 'cmd'` with `workdir` set; keep logs short by piping through `head`/`tail` if needed.
- **apply_patch first**: use it for all textual edits unless running a formatter. Mention why if you deviate.
- **Diff awareness**: repo may already be dirty; never reset or delete user changes.
- **Summaries**: final messages should cite files touched (`path:line`) and note unrun tests.

---

## 3. Repository Highlights (read-only overview)
- **Master reference**: `docs/MOBILE_DEPLOYMENT_PLAYBOOK.md`
- **Key surfaces**
  - Web app (React/Vite): `src/`
  - Mobile app (Expo RN): `mobile/`
  - Firebase Functions: `functions/`
  - Knowledge pipeline: `knowledge-pipeline/`
- **Critical standards**: production-first error handling, strict typings, named exports, logging via `logger` + Sentry.

---

## 4. Command Shortlist
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

Use `rg` for searches (`rg "term" path/`) and `jq` for JSON formatting when needed.

---

## 5. Workflow Cheat-Sheets
### Web (Vite + React 19)
1. Components live under `src/components` / `src/pages`.
2. Firebase access via `src/lib/firebase/config.ts`; avoid duplicating initialization.
3. Keep styling consistent with Tailwind tokens defined in `components.json`.
4. Tests: prefer `npm run lint` + focused unit tests when available.

### Mobile (Expo SDK 53)
1. Screens under `mobile/screens`; services under `mobile/services`.
2. AsyncStorage caches require TTL comments; follow patterns in `contextAggregator`.
3. For pose/AI work, reference `services/aiService.js` + `services/formContextService.js`.
4. Use `expo start --dev-client` for integrated testing when needed.

### Firebase Functions
1. Each new function must be exported in `functions/src/index.ts`.
2. Secrets via `defineSecret` and Firebase Secrets Manager—never plain env vars.
3. Run `npm run build` before deploying to ensure `lib/` is current.

---

## 6. Tree-of-Thought Prompts (templates)
- **Exploration**: “Potential approaches: (1) ___, (2) ___. I’ll validate by …”
- **Verification**: “What evidence shows success? Which commands confirm it?”
- **Fallbacks**: “If X fails, switch to Y by …”

Use these snippets when crafting replies to keep reasoning explicit.

---

## 7. Testing & Validation
- Prefer targeted checks: `npm run lint`, `npm run test -- file`, `tsc --noEmit`.
- When emulator/build steps are too heavy, explain why and outline what should be run manually.
- Note external dependencies (Firebase, Expo) that require credentials the agent cannot access.

---

## 8. Danger Zones & Escalation
- Do **not** touch secrets, `.env` files, or production config unless instructed.
- Avoid `git reset`, `git clean`, `rm -rf`, or mass formatting.
- If unexpected diffs appear, stop and ask the user.

---

## 9. Response Template
1. **Outcome summary** – concise, user-friendly.
2. **Details** – ordered bullets with file references (`path:line`).
3. **Verification** – tests or commands run (or skipped with reason).
4. **Next steps** – only if there’s an obvious follow-up.

Following this template keeps answers scannable and consistent with project expectations.

Happy building, Claude!
EOF
  echo "  ✅ CLAUDE.md created"
fi

# Summary
echo ""
echo "✅ Initialization Complete!"
echo "=========================="
echo ""
echo "📊 System Status:"
gh --version | head -1
echo "  Extensions: $(gh extension list | wc -l) installed"
echo "  Auth: $(gh auth status 2>&1 | grep -o 'Logged in to [^ ]*' || echo 'Not authenticated')"
echo ""
echo "🎯 Next Steps:"
echo "  1. Create your first PRD: /pm:prd-new <feature-name>"
echo "  2. View help: /pm:help"
echo "  3. Check status: /pm:status"
echo ""
echo "📚 Documentation: README.md"

exit 0
