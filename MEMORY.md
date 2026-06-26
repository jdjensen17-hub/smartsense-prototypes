# MEMORY.md — Decision Log

Significant decisions for the SmartSense ONE prototypes repo. Read at the
start of every session. Never contradict a logged decision without flagging
it first. Format per decision: **what / why / rejected**.

---

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
