# MEMORY.md — Decision Log

Significant decisions for the SmartSense ONE prototypes repo. Read at the
start of every session. Never contradict a logged decision without flagging
it first. Format per decision: **what / why / rejected**.

---

## 2026-08-19 — Image exception notification event

- **What:** Added "An image exception occurs" as the last Notifications event on `/#/operate/jolt-editor`. Email-only method, preselected and locked. Frequency dropdown: Daily (default) / Weekly. Saved chip: `roles · Email · Daily`.
- **Why:** Image exceptions are a digest, not a real-time ping. Email is the only channel that fits. Daily is the tighter default.
- **Rejected:** Showing Push/Text disabled. Helper note like "(Photo items only)". Changing the accordion summary from the hardcoded "No events configured".

---

## 2026-08-19 — Session end: scheduled template publish

**Worked on:** List Template Editor publish timing (`/#/operate/jolt-editor`). Replaced Save & Publish with autosave + Publish now / Schedule.

**Completed:**
- Draft autosaves. Unpublished until Publish or Schedule. No default send time. Cancel schedule returns to unpublished.
- Split Publish: now, or schedule date/time (HQ TZ labeled). Empty pickers until chosen. Time picker opens at 6:00 AM.
- Status: Saved / Unpublished changes / scheduled accent chip (click to edit) / Published.
- Header order: status → Publish ▾ → ⓘ → kebab. Tip: “Publish sends changes to locations that use this list. Lists already on devices do not change.”
- Toolbar: Display criteria, Preview, Columns on the Add item row. Item count and library icon removed. Columns button never blue, no count.
- Same editor control for standard and publisher accounts. Publisher Tasks not rebuilt.

**Locked:** Subscriber waiting instances stay on next daily gen. Already-on-device lists never update. Ad hoc uses published template only. No 5-minute debounce.

**In progress / next:** New chat — list template notifications (add a new one). Publisher-specific Publish tip when account type can be flipped.

**Pushed:** `74cfb8fa` on `main`. Live at `https://smartsense-prototypes.vercel.app/#/operate/jolt-editor`.

---

## 2026-08-19 — Unpublished drafts never auto-send

- **What:** Autosaved unpublished changes sit until the user publishes now or sets a schedule. No default send time. Cancel/remove schedule returns to unpublished, it does not pick a new time for them.
- **Why:** A pre-filled date/time plus “locations get the template at this time” reads as “this will happen if I do nothing.” That recreates the Publisher Tasks surprise.
- **Rejected:** Defaulting the picker to tomorrow 6:00 AM. Auto-publishing after N days.

---

## 2026-08-19 — Publish explanation is an info icon, not a button hover

- **What:** Do not put “what Publish does” on hover of the Publish button. When the header cluster is cleaned up, use an info icon + HelpTip, with separate copy for standard vs publisher accounts. Standard: pushes to locations that use the list. Publisher: own locations now; subscribers on next daily list generation. Already-on-device lists do not change.
- **Why:** Hover-on-primary-button is a weak place for high-stakes explanation (tablet, click-vs-read). Header is already overloaded.
- **Rejected:** Tooltip on the Publish button itself as the sole explanation.

---

## 2026-08-18 — Session end: Cursor setup + list editor kebab

**Worked on:** Cursor transition, share pipeline, `JoltListEditorPage` header more-options.

**Completed:**
- Cursor rules in `.cursor/rules/`. Workspace is `prototypes/`.
- Git habit: localhost needs no commit. Auto-commit a related slice. Push when Jim is ready to share.
- Header kebab (active): Import/Export Translation CSV, Send List to All Locations, Change History, Deactivate List Template, Deactivate List Instances.
- Deactivated template: warning banner, kebab is only Reactivate List Template, Preview and Save & Publish hidden.
- Reactivate opens S1 “Restore List Instances?” modal (Restore vs Only — both just reactivate in the prototype).
- Deactivate List Instances opens S1 table modal (Displays at / Due in / Expires after). Boxes start unchecked. Already-visible instances are never deactivated in this flow. Confirm currently only closes the modal.
- Display times lifted from Settings so the kebab can read them. Seeded 6:00 AM, 12:00 PM, 5:00 PM. Settings label is DUE IN.

**In progress / next:** Wire remaining kebab actions (CSV, send-all, change history). Give Restore vs Only a visible difference. Actually apply instance deactivation. Still unlocked: editing items while the template is deactivated.

**Pushed:** through `60bffc26` on `main`. Live at `https://smartsense-prototypes.vercel.app/#/operate/jolt-editor`.

## 2026-08-18 — Deactivate instances never touch already-visible lists

- **What:** Deactivate List Instances only removes upcoming instances for selected display times. Lists generated 24 hours early stay hidden until display time; those not-yet-visible batches can be deactivated. Already-visible instances have a separate flow.
- **Why:** This kebab action is a pre-display cleanup, not a live-floor recall.
- **Rejected:** Using this modal to deactivate lists already showing at a location.

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
