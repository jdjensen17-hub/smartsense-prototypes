Here's the full handoff prompt for the Preview thread:

---

**Jolt Lists — Template Editor Redesign — Preview Surface Handoff**

**Project overview**

We are redesigning the Jolt Lists template editor from the ground up in the SmartSense One design system. This is a large, multi-surface project being designed in Claude.ai before being built as a prototype in Claude Code. This thread picks up where the main design thread left off and focuses exclusively on the **Preview surface** — a net-new feature that lets template builders see how their list will look and behave on the app before publishing.

**Ground rules for this thread:**
- Do not generate code. This is a design/wireflow thread only.
- Push back on ideas where appropriate. This is a thought partnership, not an approval exercise.
- Wireflows are standalone HTML files using Inter from Google Fonts, Tabler Icons from jsDelivr CDN, and SmartSense One design tokens baked in as CSS custom properties. They are reviewed in a 1440×900 browser window, not in the Claude.ai chat interface.
- No footer notes, annotation strips, or helper text in wireflows that won't exist in the actual product. If something isn't obvious without a note, the design needs to change.
- No "user" in help text anywhere in the product.

---

**The SmartSense One design token values (bake these into every wireflow):**

```css
:root {
  --surface-0: #F0F0F2;
  --surface-1: #F7F7FA;
  --surface-2: #FFFFFF;
  --text-primary: #1A1A1F;
  --text-secondary: #5C5C6E;
  --text-muted: #9898A8;
  --text-accent: #185FA5;
  --text-danger: #A32D2D;
  --text-warning: #854F0B;
  --border: rgba(26,26,31,0.12);
  --border-strong: rgba(26,26,31,0.22);
  --border-accent: #378ADD;
  --fill-accent: #378ADD;
  --fill-accent-hover: #185FA5;
  --bg-accent: #E6F1FB;
  --bg-warning: #FAEEDA;
  --on-accent: #FFFFFF;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

---

**What has already been designed — do not revisit these decisions**

The template editor has two tabs: **Items** and **Settings**.

**Items tab** is a single surface — no separate grid/list mode toggle. Rows are lean by default: drag handle (hover-reveal), checkbox (hover-reveal), 4px color stripe, prompt text, type icon, config indicators (right-aligned, informational only). Optional columns (Allow N/A, Points, etc.) are user-controlled via a column selector in the toolbar. Optional columns and their headers hide when the side sheet or display criteria mode is active, and restore on exit.

**Toolbar** contains: select-all checkbox, Add item, Delete, Cut, Paste below, item count, question bank icon (book), column selector, optional column headers. In display criteria mode the toolbar right side shows only item count and "Exit display criteria mode" button.

**Add item** opens a popover anchored to the button with frequency-ordered type picker and alias search (e.g. "num" surfaces Measurement). New item inserts below the active item or appends at bottom.

**Active item** = last clicked row (subtle blue tint). Distinct from checkbox multi-select which is for bulk operations only.

**Kebab menu** on each row (far right, hover-reveal): Edit prompt, Change item type, Duplicate, Delete.

**Cut/paste** with multi-select for reordering at scale. Drag-and-drop retained for short lists.

**Side sheet** opens on row click. Static "Edit item" header with up/down navigation arrows and close button. Sheet is 420px wide. Optional columns hide when sheet opens, restore on close. Sheet scrolls independently — "Edit item" header is sticky. Content order:

1. Prompt text (rich text: bold, italic, heading, hyperlink — auto-expanding)
2. Background color
3. Info library
4. General options (Allow N/A, Points, Saved value for Measurement)
5. Completion mode (Yes/No only — radio: Manually complete / Auto complete)
6. Score (per answer for Yes/No and MC — No/Yes rows with score input and kebab)
7. Corrective action (toggle-driven inline rules — see detail below)
8. Flags (toggle to enable, rule table per answer/range, + Create new flag inline in picker)
9. Tags (Location multiselect, Score group dropdown, Importance dropdown — account-managed)
10. Labels
11. Type-specific config (Measurement options, MC choices, etc.)

**Corrective action** is inline progressive disclosure. Two independent toggles: "Turn on corrective action for N/A" and "Turn on corrective action for Yes/No" (or "ranges" for Measurement). Each toggle reveals rule cards. Rule card field order: optional checkbox → condition (or range + condition for Measurement) → CA list (disabled when ad hoc checked) → ad hoc checkbox → next step (defaults to Repeat item). CA list selector disabled when ad hoc is checked. Add corrective action button adds additional rules. Remove button per card.

**Multiple Choice choices:** Draggable rows with color/icon circle, text, score per choice, kebab (Flags + Delete on list templates). Color/icon picker is a tabbed popover — Color tab and Icon tab fully independent. 18 colors (none swatch + 17). Icon selected state is a blue toggle — tap again to deselect. No preview bar in picker.

**Display criteria mode** — entered via "Display criteria" toolbar button which becomes "Exit display criteria mode" when active. Two sub-modes:

*Build mode:* Banner reads "Click any item to start linking · click a filter indicator to inspect." Click a child item → all eligible parent types (Y/N, Measurement, MC, Custom Rating, Rating 1-5, Rating 1-10) show "Set as parent" on hover regardless of position. Ineligible types dimmed. Click a parent → condition panel opens as right-side panel. Y/N: value dropdown (Yes/No) only. Measurement: operator dropdown (>, ≥, =, ≤, <) + numeric value. OR conditions supported via "Add another condition." Save confirms. Color-coded relationships: each parent gets a unique color, children share parent's stripe color (4px left stripe only, no background tint). Multi-parent children get stacked stripes.

*Inspect mode:* Triggered by clicking the filter indicator on an item with conditions. All unrelated items hidden. Parent shows "controls ↓" tag. Child shows clickable condition badge (click to edit) + Remove link button. Banner reads "Inspecting display criteria" with "Exit inspect" button. Post-unlink shows "Always visible" badge. No automatic exit — user-controlled.

**Settings tab** sections in order: List submission (radio) → Scoring (toggle, gates score fields on items) → List schedule (always collapsed, summary line, expands inline) → Notifications (event-first: List is displayed → Item is out of range → Before list is due → Item is overdue → List is completed; inline add form with role search + method chips) → Role-based access (additive model, Assigned/Manage toggles per role) → Create settings → Shared or individual.

**List schedule** sections: Display times (single-row cards: time + due offset + expiry offset inline, apply-to-all panel when >1 time) → Repeats (segmented control: Daily/Weekly/Monthly/Custom) → Active months (Specific months or Date ranges mode) → bottom toggles (Bump lists, Offer to re-display after submission, Ignore blackouts).

**Header ⋮ menu** (left of Save): Publish Changes, Import Translation CSV, Export Translation CSV, Send List to All Locations, Change History (opens new tab), Deactivate List (danger, bottom).

---

**Key design principles — non-negotiable**

- One surface, not two modes. No "click here for a different view" unless the job genuinely requires a mode shift (display criteria is the justified exception).
- Progressive complexity — simple cases fast, complex cases accessible.
- Inline everything where possible. No modals, no navigation away for configuration.
- Popover/panel interactions anchor to context — never float disconnected from what they're configuring.
- No "user" in help text anywhere. Rephrase to describe the action or the role.
- Banner instructions must be scannable in under two seconds. If it requires reading, it's too long.
- Wireflows stand alone — no footer notes, annotation strips, or helper text that won't exist in the product.
- If something isn't obvious without a note, the design needs to change.

---

**What Preview needs to do**

Preview is a net-new surface that lets a template builder see how their list will look and behave on the app before publishing. It does not exist in any form in the current product.

**Primary job:** Trust-building before publish — "does this look right on the app?" Let the builder catch formatting issues, verify section breaks, understand the list flow, and confirm display criteria behavior before the list goes live to locations.

**Critical dependency — the List Completion side sheet**

Earlier in this project we referenced a List Completion prototype — a surface where users complete list instances via a side sheet that mirrors the app experience. Screenshots of that prototype are included with this prompt. Preview should stay visually and behaviorally consistent with the List Completion side sheet, since both are simulating the same app experience from the same product. Study those screenshots carefully before proposing anything. The goal is that a user who has completed a list in the List Completion surface would immediately recognize the Preview surface as the same interaction.

**Context on the app experience**

The Jolt app is a mobile app (iOS and Android) used primarily on shared floor devices — iPads and iPhones in restaurant/retail environments. Lists are completed by frontline workers. The app renders items sequentially, one section at a time. Item types have distinct visual treatments on the app — a Yes/No item looks different from a Measurement item which looks different from a Photo item. Display criteria items are hidden until their parent condition is met. The Preview surface should simulate this as faithfully as possible within the web editor context.

---

**Open questions Preview needs to answer — work through these before wireframing**

1. **Where does Preview live?** Is it a third tab (Items / Settings / Preview), a view mode toggled from the Items toolbar, or a separate surface altogether? The two-tab architecture was chosen deliberately to replace a PHP/React tab boundary — adding a third tab is acceptable if justified. The architecture must remain extensible for audit templates which may need additional tabs.

2. **Is Preview interactive or read-only?** Can the builder tap through the list as if completing it, or is it a static render? Interactive Preview is significantly more valuable — it lets the builder experience display criteria logic in action — but it's also more complex to build. A read-only render with display criteria visualization may be sufficient.

3. **How does Preview handle item types that require real data?** A Measurement item with a range needs a value to show corrective action behavior. A Multiple Choice item needs an answer selected to show conditional items. Does Preview use placeholder/sample data, let the builder enter test values, or show a simplified representation?

4. **Does Preview simulate display criteria logic?** If a Photo item is hidden until "Walk-in cooler OK?" is answered No, does Preview show it hidden by default? Can the builder interact with the parent item to reveal the child? This is the highest-value Preview behavior and the most complex to implement.

5. **How does Preview relate to the List Completion side sheet?** Are they the same component in different contexts (ideal but complex), or separate designs that share visual language? The answer determines how much design work Preview requires and how much can be borrowed.

6. **What is the viewport model?** Does Preview show a full-width render of the app experience, or does it simulate a mobile device frame (showing the list at ~390px iPhone width)? A device frame adds realism but may feel gimmicky. Full-width with mobile-proportioned elements may be more practical.

7. **Does Preview need a toolbar or controls?** If interactive, the builder needs a way to reset state (clear all entered values), perhaps a way to jump to a specific item, and a way to exit Preview and return to editing. Where do these live?

---

**Wireflow files produced in the main design thread**

These are available in the project knowledge and can be retrieved via conversation search if needed:

- `jolt_editor_wireflow_v4.html` — Items surface, 4 states
- `jolt_sidesheet_v3_full.html` — Side sheet, all 4 item types
- `jolt_sidesheet_v2_yn.html` — Yes/No sheet with Tags section detail
- `jolt_corrective_action_yn_v2.html` — Corrective action, Yes/No
- `jolt_corrective_action_measurement.html` — Corrective action, Measurement
- `jolt_mc_picker_v2.html` — MC color/icon picker
- `jolt_schedule_wireflow_v2.html` — List schedule builder
- `jolt_settings_wireflow_v1.html` — Settings tab
- `jolt_add_notification_wireflow.html` — Add notification flow
- `jolt_display_criteria_wireflow_v4.html` — Display criteria build + inspect mode
- `jolt_kebab_wireflow_v1.html` — Kebab menu and active item concept
- `jolt_add_item_wireflow_v1.html` — Add item popover interaction

---

**How to begin**

Study the List Completion screenshots included with this prompt. Then work through the seven open questions above before proposing any wireframes. The relationship between Preview and the List Completion side sheet is the most important design decision in this thread — getting that right determines everything else. Don't start drawing until we've agreed on an answer to at least questions 1, 2, and 5.
