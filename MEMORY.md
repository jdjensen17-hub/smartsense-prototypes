# MEMORY.md — Decision Log

Significant decisions for the SmartSense ONE prototypes repo. Read at the
start of every session. Never contradict a logged decision without flagging
it first. Format per decision: **what / why / rejected**.

---

## 2026-08-18 — Cursor replaces Claude Code for prototype builds

- **What:** Ported the CLAUDE.md operating contract into `.cursor/rules/`.
  Workspace root is this repo (`prototypes/`), not the parent Projects folder.
  Parent context docs stay on-demand at `../company.md`, `../product.md`,
  `../goals.md`, `../personas.md`. Grok does both research and build.
- **Why:** Chat memory dies between threads. Rules persist. Opening the parent
  folder pulled repos and hundreds of unrelated markdown files into scope.
- **Rejected:** Dumping every Projects/*.md into always-on context. Recreating
  Claude skills on day one. Importing a backlog of Claude Code conversations.
- **Research → build:** Plan chat for research and interaction states. Fresh
  Agent chat for infrastructure, then another for the page. Split exists to
  keep context debt out of the build, not because the models differ.

## 2026-08-18 — Claude conversation import policy

- **What:** Do not import Claude Code conversations unless Jim names a
  specific in-flight thread. If one is named: import that thread only,
  extract decisions into this file immediately, then discard the transcript.
- **Why:** Stale thread context will fight the new rules. This file and the
  rules are the durable record.
- **Rejected:** Bulk import as onboarding.
- **This session:** No in-flight thread was named. Nothing imported.

## 2026-08-18 — Share pipeline and git habit

- **What:** Confirmed existing pipeline. Local `prototypes/` on `main` →
  push to `github.com/jdjensen17-hub/smartsense-prototypes` → Vercel project
  `smartsense-prototypes` → `https://smartsense-prototypes.vercel.app`.
  Local review is Vite on localhost and does not require a commit. Auto-commit
  a related batch after a completed prototype slice. Push only when Jim is
  ready to share. This pipeline is for this repo only.
- **Why:** Jim inspects instantly on local, then batches a set of related
  changes before publishing. He thought a commit was required to see changes
  on the local URL — that is wrong; Vite hot-reloads the working tree.
- **Rejected:** Auto-push after every change (old Claude Code habit). Rebuilding
  the Vercel/GitHub integration. Publishing the disposable calibration page.

## 2026-08-18 — Cursor calibration page

- **What:** Built a disposable `/internal/cursor-calibration` page to prove
  shell + S1 tokens, then deleted it. Not committed. Not on Vercel.
- **Why:** Setup check only. A public URL does not need that route. Contract
  files (`.cursor/rules/`, MEMORY.md, CLAUDE.md) are what get backed up.
- **Rejected:** Building a fake Operate/Assure feature as a "calibration."
  Restyling the shell or CreateListPage as drive-by cleanup. Pushing the
  calibration page to the public site.

## 2026-06-25 — Permission mode set to bypassPermissions

- **What:** Set `.claude/settings.local.json` to
  `permissions.defaultMode = "bypassPermissions"` for this prototypes repo.
  No tool permission prompts fire here. Replaced a stale 40-entry allow-list
  (one-off git commands, process kills, specific commit hashes) that had
  accumulated from clicking "always allow."
- **Why:** Jim is a PM, not a developer. The constant "Claude wants to run X
  — Allow?" popups for commands he can't evaluate were interrupting prototype
  builds with no real safety benefit. This repo is 100% throwaway prototype
  work with no production data, so zero-prompt is the right tradeoff.
- **Rejected:** "Broad allow-list + deny guardrails" (still some prompts) and
  "Moderate" (prompt on push/uninstall/delete) — Jim chose fully
  uninterrupted. The CLAUDE.md HARD STOPS list is kept as the conversational
  safety guard, and it cannot be deleted casually: it's what makes me pause
  before destructive/irreversible actions, especially on production code.
- **Scope note:** Settings are per-repo and `settings.local.json` is
  gitignored. The employer's production repos (e.g. the Universal App) keep
  their stricter defaults — this change does not touch them.
