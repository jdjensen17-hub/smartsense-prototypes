# MEMORY.md — Decision Log

Significant decisions for the SmartSense ONE prototypes repo. Read at the
start of every session. Never contradict a logged decision without flagging
it first. Format per decision: **what / why / rejected**.

---

## 2026-09-30 — Session end: Admin Integrations, then author attachment

**Worked on:** Admin → Integrations (`/#/admin/integrations`). Microsoft connect, site allowlist, disconnect. Local only.

**Completed:**
- Catalog of cards. Microsoft is the only flow. Placeholders: Google Drive Connected, Dropbox and Box Disconnected.
- Entra sign-in mock, then a list of sites already granted in SharePoint. Add / Remove is the product allowlist for list templates. No search, no URL box. Legal Hold is granted and not added.
- Done returns to the catalog and does not save again.
- Status is Connected or Disconnected. Incomplete setup stays in helper text on the Microsoft screen.
- Disconnect helper: “Click Disconnect to remove the link between SmartSense and your Microsoft sites. Your admin will have to re-login to restore the connection.”

**In progress:** Nothing on Integrations.

**Next:** New chat. On `/#/operate/jolt-editor`, each list item can attach either an Information Library file or a cloud file. See “2026-09-30 — Item file is library or cloud.” Do not push until asked.

**Not done:** The banner after Disconnect still says revoking access in Microsoft is separate and Microsoft is the source of truth.

---

## 2026-09-30 — Item file is library or cloud

- **What:** On the List Template Editor (`/#/operate/jolt-editor`, `src/pages/operate/JoltListEditorPage.tsx`), General Options on every item has the block now labeled Info Library (`InfoLibrarySection`). That block becomes the place an author attaches one file. The file is either an Information Library file or a cloud file from a SharePoint site that was Added on Admin → Integrations. One source at a time. Choosing one clears the other. Clearing returns to both choices. The inline toggle stays and applies to whichever file is attached. Cloud files only come from sites on the product allowlist (`msMemory` added sites). Legal Hold does not appear unless it was Added. If Microsoft is Disconnected, or Connected with no added sites, Cloud drive is visible and disabled, with one line that an admin adds sites under Integrations. No Entra flow from the editor. No device file picker. No tenant search, URL paste, or folder tree. Keep `infoFile` as the display name. Add `infoSource?: 'library' | 'cloud'`. Library files are a short seed in the editor. Do not edit `/#/information`. Do not change the Integrations screens. Do not restyle the editor off the local `T` tokens. Mobile open and the preview page stay as they are.
- **Why:** Authors attach checklist content after an admin has connected Microsoft and added sites. The library stays a separate source. The current control uploads a file from the computer, which is not either source.
- **Rejected:** Both sources on one item. Browsing every SharePoint site. Starting connect from the item. A third catalog status for “add sites.” Rebuilding preview or the mobile open flow in this slice.

---

## 2026-09-29 — Session handoff

- **Worked on:** `/#/information` polish, then where Connect Microsoft belongs.
- **Completed:** Subcategory permissions (scope tree, everyone default, no people, no download toggle). File grip moves a file to another subcategory. Row tools removed; kebab only. Office kebab says Download. Category and subcategory kebabs. Subcategory icons indented under the parent. Status bar at the bottom of the categories column (count and formatted size). Viewer detail line includes size. Floating plus button removed.
- **Completed (build thread):** Admin → Integrations at `/#/admin/integrations`. Microsoft connect, site list, and disconnect are in-memory only. `/#/information` was not changed.
- **In progress:** Nothing.
- **Next:** Author linking and the mobile open flow stay out of this slice. Do not push until asked.

---

## 2026-09-29 — Connect Microsoft lives under Admin Integrations

- **What:** Connect Microsoft is a tenant integration, not an Information Library control. Admin → Integrations is a catalog of cards. Connected cards first. Each card has a name, one sentence on what the customer uses it for, and a status (Not connected, Connected, or Needs setup). Clicking a card opens that integration’s own screen. Microsoft’s screen is the admin workflow from the PRD: Connect, site allowlist, Disconnect. Card copy: “Link SharePoint and OneDrive files to checklist items. Store teams open them in the app without a Microsoft login.” Source: Confluence “PRD: Cloud Drive Content Integration for Checklists” (`6186205214`, tiny link `HgC6cAE`). The 2026-09-29 SS1 screenshot shows Admin → Integrations with “Integrations marketplace is coming soon.” This prototype has no Integrations route yet. Build it in `App.tsx` under Admin. Do not rebuild the shell to match that screenshot. Do not use Admin → Distribution (that page is location rules).
- **Why:** One Microsoft connection per customer tenant. A privileged admin consents once. Authors later attach either a library file or a cloud file on a checklist item. The library stays a separate source.
- **Rejected:** Connect Microsoft on `/#/information`. A store or marketplace. Expanding every integration inline on the catalog. Author linking and mobile open in the first slice.

---

## 2026-09-29 — Integrations prototype slice

- **What:** `/#/admin/integrations` sits in the existing Admin accordion, after Distribution. Shell title is Integrations. Cards group as Connected, then Needs setup, then Not connected. An empty group is omitted, so a catalog with nothing connected does not show an empty Connected heading. Microsoft is the only flow: Not connected, consent Accept or Deny, Connected with no sites, add and remove sites, Connected and ready, Disconnect back to Not connected. Deny keeps no connection. State lasts for the browser session. Placeholder cards — Google Drive (Connected), Dropbox (Needs setup), Box (Not connected) — use the same card and open a screen with no connect flow, so the grid and groups show before Microsoft is connected.
- **Why:** Hiding an empty Connected group means grouping stays invisible if every card starts Not connected.
- **Rejected:** A real OAuth redirect. Seeding Microsoft as already connected. Connect controls on the placeholders. Admin → Distribution. Copying the production SS1 nav from the 2026-09-29 screenshot.

---

## 2026-09-29 — Microsoft connect starts as a mocked Entra sign-in

- **What:** Connect Microsoft opens a full-screen sign-in mock. Clicking the email field fills `itadmin@acme.onmicrosoft.com` and a password. Login is enabled only after that fill, then opens a permissions screen for Sites.Selected. Accept stores the connection and returns to the site list. Cancel stores nothing and returns to Not connected. Nothing is sent to Microsoft.
- **Why:** The team needs to see the real handoff: customer admin signs in at Microsoft, then approves the permissions the app already requested, before they pick sites.
- **Rejected:** Leaving consent as a SmartSense card with Accept and Deny. A real redirect to login.microsoftonline.com. Letting Login continue with empty fields.

---

## 2026-09-29 — Site list is the SharePoint grant; Add/Remove is the product allowlist

- **What:** After Accept, the page lists sites already granted in SharePoint. There is no search and no URL box. Add makes a granted site available to template admins. Remove takes it off that list and does not change the SharePoint grant. Legal Hold is in the granted list so a site can show without being added.
- **Why:** Sites.Selected cannot search the tenant. A SharePoint grant can exist for work that is not checklist content, so showing a site is not the same as offering it to authors.
- **Rejected:** A search box. A folder tree of the whole tenant. Pasting a site URL to grant it from this screen. Treating Remove as a SharePoint revoke.

---

## 2026-09-30 — Disconnect helper is about restoring the link

- **What:** The Disconnect card says: “Click Disconnect to remove the link between SmartSense and your Microsoft sites. Your admin will have to re-login to restore the connection.”
- **Why:** The old copy talked about Microsoft as the source of truth. This copy tells the admin what the button does and what it takes to come back.
- **Rejected:** Keeping the revoke-in-Microsoft sentence on that card.

---

## 2026-09-30 — Site list helper names list templates

- **What:** The site-list helper reads: “These sites are already granted in SharePoint. Click Add to make a site available to list templates.” The sentence about Remove and the SharePoint grant is gone from the screen. Remove still only changes the author list.
- **Why:** The second sentence explained a distinction the button row already shows. The audience is list templates, not “template admins.”
- **Rejected:** Keeping both sentences. Leaving “template admins” in the helper.

---

## 2026-09-30 — Catalog status is Connected or Disconnected

- **What:** Integrations has two statuses: Connected and Disconnected. There is no Add sites label and no Add sites section. Microsoft is Connected as soon as consent is accepted, including when no site is on the author list. The Microsoft screen’s helper text says when authors still cannot browse. Dropbox, which only existed to fill the middle group, is Disconnected. This replaces the 2026-09-30 “Middle status is Add sites” label.
- **Why:** Other connectors will not all need sites. A third status named for Microsoft’s setup step does not fit the catalog.
- **Rejected:** Keeping Add sites as a catalog section. Hiding incomplete Microsoft setup. A per-connector status vocabulary.

---

## 2026-09-30 — Middle status is Add sites

- **What:** The middle status label is Add sites, on the catalog group and on the card badge. It still means consent is done and no site is on the author list. Disconnect stays on that screen. This replaces the “Needs setup” label from the 2026-09-29 Integrations prototype slice.
- **Why:** Needs setup read like Not connected, so Disconnect looked out of place.
- **Rejected:** Hiding Disconnect until a site is added. Keeping the Needs setup label.

---

## 2026-09-30 — Done leaves the Microsoft site screen

- **What:** After the connection exists, a primary Done button sits at the bottom of the site list and returns to the Integrations catalog. It does not save. Add and Remove already saved. Done shows with zero sites added. Disconnect stays in its own card.
- **Why:** The only exit was the back chevron. A Save or Confirm would make the toggles feel provisional.
- **Rejected:** A confirmation that re-saves the allowlist. Hiding Done until at least one site is added.

---

## 2026-09-28 — Permissions belong to subcategories

- **What:** On `/#/information`, view permissions are stored on the subcategory. Edit permissions is enabled only when a subcategory is selected. The modal title is “Edit subcategory permissions.” Sections, in order: Distribution scope (org tree from `nodes` in the People scope picker; default Acme Foods, collapsed to that node; choosing a node collapses the tree to the selection; one node, a parent covers its children), Who can view (everyone in that scope, or selected roles), Roles with access. File rows and parent categories do not have their own permissions.
- **Why:** Legacy Jolt applies permissions to subcategories, not to individual files or parent categories.
- **Rejected:** Keeping Edit permissions tied to the selected file. A permissions action on the file row or in the viewer. A “Selected people” audience. An “Allow download” toggle. Legacy Jolt does not support person-level permissions or a download permission.

---

## 2026-09-28 — New subcategory lives on the category row

- **What:** The Categories column is 300px. Its header folder-plus always creates a category. Each category and subcategory row has a kebab. Category actions are New subcategory, Rename, and Delete. Subcategory actions are Rename and Delete. A status bar pins to the bottom of the column when a row is selected and shows that selection’s file count and total size. The folder list scrolls above it. The bottom New category button and the Files-header New subcategory button are gone. File table columns: kebab 40px, Updated 200px, Type 130px. The Category column is 240px so the name column takes the remaining width. Row view, edit, and delete live in the kebab only.
- **Why:** Two category-create controls, and New subcategory sat on the file toolbar away from the tree. A single icon whose action changed with selection would create the wrong thing. 300px is the room the category name needs once row actions are showing.
- **Rejected:** A 3-state header icon (new category / new subcategory / disabled with a sub-subcategory tooltip).

---

## 2026-09-28 — Type filter sits in the file header

- **What:** The Sort dropdown and the Files header Sort A–Z button are gone. Sorting is the column headers only. Search and the Type dropdown sit on the right of the blue toolbar. Search is immediately left of Type. Type has no visible label. The white heading row (All files, file count, breadcrumb) is gone.
- **Why:** Sort and Type sat above the tree and felt disconnected from the table they control. Column headers already sort. Search and Type both filter that table, so they belong next to the file heading.
- **Rejected:** Keeping a name-only Sort dropdown. Leaving Search in a toolbar above the library. A “Type” label on the dropdown.

---

## 2026-09-28 — Information grid sorts from the column headers

- **What:** On `/#/information`, Name, Type, Category, and Updated sort by clicking the header. Click again to flip direction. Name, Type, and Category start A–Z. Updated starts newest first. The Sort dropdown and the Files header Sort A–Z button were removed the same day — see “Type filter sits in the file header.”
- **Why:** “Updated” in the Sort dropdown fought the Files strip and did not match how the grid is read.
- **Rejected:** Leaving Updated in the dropdown. A separate updated sort that the column headers do not show.

---

## 2026-09-28 — No URL entries in the information library

- **What:** Upload has no URL / link field. URL is not a file type. The Brand asset portal seed row is gone.
- **Why:** Legacy Jolt does not let an author add a public URL as a library entry.
- **Rejected:** Keeping the optional link field from the HTML mock.

---

## 2026-09-28 — Information Library is one page with in-memory state

- **What:** `/#/information` is a seeded author library. Category → subcategory → file. Tree filters the table. Upload, custom text file, permissions, viewers, and delete are states of that page. Office rows download. Viewers are placeholders. Dragging a grip moves a file onto another subcategory. Reordering rows in the list is not in this slice. Shell and drawer order stay as already built. URL entries were removed the same day — see “No URL entries in the information library.”
- **Why:** The HTML mocks are states of one screen. Separate routes would not share a library you can add to.
- **Rejected:** A route per mock file. Copying the mock drawer (Information under Operate). Rebuilding the top bar.

---

## 2026-09-25 — Information is a leaf in the nav, not an accordion

- **What:** Drawer order is Admin, Information, Operate. Information is a single link to `/#/information`. Header title is Information Library. Page is a Coming soon placeholder at `src/pages/information/InformationLibraryPage.tsx`. No child items.
- **Why:** The module has one destination for now. Admin and Operate expand because they have children. Information does not.
- **Rejected:** An Information accordion with a Library child. Putting the item anywhere other than between Admin and Operate.

---

## 2026-09-09 — Empty-instance row in Deactivate List Instances

- **What:** When a display time exists but nothing is left to deactivate, the modal keeps the row. Checkbox disabled. Due in / Expires after replaced by "No undisplayed lists to deactivate." spanning those two columns. Select-all skips that row. Empty-schedule copy ("No display times configured.") is unchanged.
- **Why:** 6:00 AM already displayed and tomorrow's generation hasn't run is a real gap. Treating it as "no display times" hides a configured slot.
- **Rejected:** Live clock check. Prototype always uses the first display-time row (seeded 6:00 AM) as the empty slot.

---

## 2026-08-20 — PDF attachment on list email notifications

- **What:** On `/#/operate/jolt-editor` Settings → Notifications, "List is displayed" and "List is completed" show a toggle when Email is selected: "Attach a PDF copy of the report to the email". Default off. Hidden if Email is deselected. Saved chip appends ` · PDF` when on.
- **Why:** Those two events produce a report; email is the only method that can carry a file.
- **Rejected:** Offering the toggle on Push/Text, or on other events. Defaulting it on.

---

## 2026-08-19 — Hide the Items grid scrollbar

- **What:** Native scrollbar on the `/#/operate/jolt-editor` Items table scroller is hidden. Wheel/trackpad still scroll. Horizontal overflow is `hidden` unless extra columns are on.
- **Why:** Chrome reserved a white gutter even when idle. That lane was not an affordance; you already discover scroll by scrolling.
- **Rejected:** Overlay/auto-hide thumb. Styling the reserved gutter so it looks intentional.

---

## 2026-08-19 — Item side sheet sits below the toolbar

- **What:** On `/#/operate/jolt-editor` Items, the item side sheet starts at the bottom of the toolbar, not the top of the Items pane. Toolbar stays full width. Sheet only shares space with the table.
- **Why:** Opening an item squeezed Display criteria / Preview / Columns; the buttons shifted and didn't fit.
- **Rejected:** Overlaying the sheet on the table (toolbar would still be full width, but the table wouldn't shrink). Expanding the editor past `maxWidth: 1026` when the sheet opens.

---

## 2026-08-19 — Photo item becomes Media + Allow video

- **What:** On `/#/operate/jolt-editor`, Photo is now Media (`ti-photo`). Options section is Media Options. New "Allow video capture" toggle (default off) above upload. MEDIA column group has Allow Video left of Allow Upload; column auto-shows when the toggle or grid checkbox turns on.
- **Why:** Video capture is an option on the same item type, not a new type. Existing upload + detect() column pattern.
- **Rejected:** Changing the internal type from `'photo'`.
- **Preview:** Take Photo always. Take Video between Take Photo and Upload Media when the toggle is on. Buttons stack on the right. Video tap shows a video placeholder. Upload button label is Upload Media.

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
