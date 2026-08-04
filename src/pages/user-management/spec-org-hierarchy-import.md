# Org Hierarchy Import

## Intent
Admins need a way to establish or replace their organization's location hierarchy by uploading a CSV file that maps locations to org units (regions, districts, franchisees, etc.). Without this, hierarchy must be built manually location by location — infeasible at scale. The import wizard walks admins through file upload, field mapping, hierarchy definition, attribute selection, and validation before committing the import. This lives in the Admin module.

## Module
admin

## User journey

### Pre-wizard: Before You Begin modal
When the user navigates to the import page, a modal appears over the content before any step renders. The modal:
- Displays a "Before You Begin" heading and a brief explanation that the wizard will build the org hierarchy from a CSV file with one row per location.
- Contains a labeled text field for **Org Name** — the name of the root node (top of the hierarchy). This field is required before the user can continue.
- Has a **CANCEL** button that navigates back to `/admin/org` without starting the wizard.
- Has a **CONTINUE** button that: (1) dismisses the modal and (2) immediately opens the OS file browser filtered to `.csv` files. The user does not need to click the upload zone separately.

### Step 1 — Upload File
The upload zone accepts a CSV file via drag-and-drop or file browser (opened via the CONTINUE button or by clicking the zone).

**Before a file is loaded:**
- Upload zone is a dashed-border box with a cloud-upload icon, "Drop your CSV file here" label, and "or click to browse" subtext.
- Clicking the zone opens the file browser.
- Dragging a file over the zone highlights the border and background.

**After a file is loaded:**
- The zone switches to a "loaded" state: shows a file icon, the filename, row count (e.g., "1,234 rows"), and column count (e.g., "8 columns").
- A "Replace file" text button inside the zone lets the user swap the file without leaving the step.
- Below the upload zone, a "Detected Columns" section renders all CSV column headers as pill chips.
- NEXT becomes enabled.

**On load, the system automatically:**
- Parses the CSV (handles quoted fields, embedded commas).
- Auto-maps CSV headers to system fields using fuzzy matching (see Step 2).
- Pre-selects all columns not consumed by field mapping as location attributes (used in Step 4).

### Step 2 — Map Location Fields
The user maps CSV columns to system-defined fields.

**Field list (two sections):**

*Required fields:*
- External ID — the unique location identifier from the source system
- Location Name — the human-readable name of each location

*Optional fields:*
- Address, City, State, Postal Code, Phone, Timezone, Status

Each field row shows:
- The system field name with a REQUIRED or OPTIONAL badge
- A dropdown (custom select) listing all CSV headers plus "— Not mapped —" as the first option
- The currently selected value (auto-mapped on load where possible)

Auto-mapping logic: for each system field, the system checks CSV headers against a set of match hints (case-insensitive, non-alphanumeric characters stripped). The first header that contains or is contained by any hint is selected automatically. If no match, the field defaults to "— Not mapped —".

Auto-mapping hints by field:
| Field | Hints |
|---|---|
| External ID | storeid, storeno, externalid, locationid, id |
| Location Name | locationname, storename, name |
| Address | address, street, addr |
| City | city |
| State | state, province |
| Postal Code | zip, postal, postalcode, zipcode |
| Phone | phone, phonenumber, tel |
| Timezone | timezone, tz |
| Status | status, active |

**Status value mapping sub-section:**
When the Status field is mapped to a CSV column, a sub-section appears below the field list. It shows each distinct value found in that column alongside its row count, with a dropdown to classify each value as **Active** or **Inactive**. The system auto-classifies:
- "closed" or "inactive" (case-insensitive) → Inactive
- All other values → Active

If a value doesn't match "active", "inactive", or "closed", an amber warning icon appears next to it (advisory only, does not block).

**Advancing:** Both External ID and Location Name must be mapped to a CSV column. NEXT is disabled until this condition is met.

**Side effect:** When mapping changes, attributes in Step 4 auto-update — columns no longer consumed by field mapping are added to the attribute pool; columns newly consumed are removed.

### Step 3 — Define Hierarchy Levels
The user assigns CSV columns as ordered hierarchy levels (e.g., Region → District → Franchisee). The step has a two-column layout:

**Left — Available Columns:**
Lists CSV headers that are not already mapped as system fields. Each column appears as a draggable chip with a drag handle icon. Clicking a column adds it as the last hierarchy level. If all columns are assigned, shows "All columns assigned."

**Right — Hierarchy Levels (ordered list):**
Shows the current hierarchy in top-to-bottom order. When empty, shows a dashed drop zone with the prompt "Drag columns here to define your hierarchy levels."

Each level card:
- Has a left blue border accent and a drag handle for reordering.
- Shows the level's display label (editable inline) and, if renamed, the original CSV column name below it as "from: [column]".
- Clicking the label text activates an inline text input. Pressing Enter or Escape or blurring commits the edit.
- A hover-reveal pencil icon appears next to the label when the card is hovered.
- Shows a disclosure row: "N values" with a chevron toggle. Expanding it lists all distinct values for that column with their row counts. Values with a count of 1 show an amber warning icon (advisory).
- Has an X button (visible on the card) to remove the level; hover turns the X red.

Levels are visually indented by their position (each level 20px further right than the previous) to suggest depth.

**Drag behavior:**
- Available columns can be dragged into the levels list at any position (a blue indicator bar shows the insertion point).
- Levels can be dragged to reorder within the list.
- Levels can be dragged back to the Available Columns panel to remove them.

**Right panel — Hierarchy Preview:**
Appears on Step 3 and remains visible through Step 5. It is a fixed-width (300px) panel with:
- A "Hierarchy Preview" header.
- A PREVIEW button (disabled when zero levels are defined; label changes to UPDATE after first preview).
- A tree view that renders the hierarchy after the button is clicked.
- A stale-data warning banner (amber) that appears if the user changes hierarchy levels after a preview has been generated — prompts them to click UPDATE.

Preview tree behavior:
- Root node (the org name entered in the modal) is always shown.
- Non-leaf folder nodes expand by default; the bottommost level of folders (those whose children are all locations) collapses by default.
- Clicking a folder node toggles expand/collapse.
- Location nodes show a store icon and are not expandable.
- Indentation increases with depth (16px per level, 8px base).

**Advancing:** At least one hierarchy level must be defined. NEXT is disabled with zero levels.

### Step 4 — Location Attributes
Remaining CSV columns (not used as system field mappings or hierarchy levels) can be imported as custom location attributes.

- A "Location Attributes" header with a "Select all" / "Deselect all" toggle button.
- Each available column is a checkbox row showing the column name and its value count (total row count, since every row has a value for every column).
- All qualifying columns are pre-selected by default (inherited from the auto-selection done on file load).
- NEXT is always enabled on this step (zero attributes selected is valid).

### Step 5 — Preview & Commit
A summary and commit screen.

**Stat cards (row of 4):**
- **Locations** — count of unique External IDs in the CSV
- **Org Units** — count of distinct hierarchy path segments (e.g., each unique region, district, etc.)
- **Attributes** — count of selected attribute columns
- **Ungrouped** — count of locations that have a blank value for any hierarchy level column (will not be placed in the tree). Value appears in red if > 0; gray if 0.

**Validation panel (appears only when issues exist):**

*Blocking Errors (red, must resolve before import):*
- Duplicate External ID values found (count shown)
- Rows missing External ID (count shown)
- Rows missing Location Name (count shown)

When blocking errors exist: the commit section is hidden entirely and the COMMIT IMPORT button is not shown.

*Warnings (amber, can acknowledge to proceed):*
- If any locations are ungrouped: shows count and an explanation that they will be placed in Ungrouped and can be assigned later.
- An acknowledgment checkbox reads "I understand N location(s) will be placed in Ungrouped and can be assigned later."
- The commit button remains disabled until this checkbox is checked.

**Commit section (shown when no blocking errors):**
- A green check mark with a "Ready to import — N locations, N org units, N attributes" summary line.
- A **COMMIT IMPORT** primary button. Disabled until all warnings are acknowledged.
- A note below the button: "This will replace the current hierarchy. An audit record will be generated."

**On commit:**
1. Button enters a loading state (label changes to "IMPORTING…", button disabled).
2. The system fires an API call with the full mapped dataset (locations, hierarchy, attributes, org name, status value mappings).
3. On success: navigate to `/admin/org`.
4. On failure: show an error state (error message inline; button re-enables so the user can retry).

### Navigation — left sidebar
A sticky left sidebar shows all 5 steps as a vertical list. Each step has a circle indicator and label:
- **Completed steps** (before current): green filled circle with checkmark. Clickable — user can navigate back to any completed step.
- **Active step**: blue filled circle with step number. Not clickable (already there).
- **Locked steps** (beyond the highest step reached): outlined circle with step number in blue. Not clickable.

Clicking a completed step jumps directly to it. The `maxReached` value tracks the furthest step the user has visited — once unlocked, a step stays unlocked even if the user goes back.

### Navigation — sticky footer
Fixed to the bottom of the viewport across all steps:
- Left: **CANCEL** (on Step 1) or **BACK** (Steps 2–5). CANCEL navigates to `/admin/org`. BACK goes to the previous step.
- Center: "Step N of 5" label.
- Right: **NEXT** button (Steps 1–4), disabled when `canAdvance()` is false. Step 5 has no NEXT button (replaced by an invisible spacer to keep the layout balanced).

---

## Acceptance criteria

### Before You Begin modal
- [ ] The modal appears on page load before any step content is visible.
- [ ] The modal contains an Org Name text field that is required.
- [ ] CANCEL navigates to `/admin/org` without starting the wizard.
- [ ] CONTINUE is disabled (or prevents action) if Org Name is blank.
- [ ] CONTINUE with a valid Org Name dismisses the modal and immediately opens the OS file browser.

### Step 1 — Upload File
- [ ] The upload zone accepts `.csv` files via drag-and-drop.
- [ ] Dragging a file over the zone changes the border and background color.
- [ ] After a file loads, the zone shows the filename, row count, and column count.
- [ ] "Replace file" swaps the file without navigating away from Step 1.
- [ ] Detected column chips appear below the zone after a file is loaded.
- [ ] NEXT is disabled until a file is loaded.
- [ ] Non-CSV files are ignored (not parsed, no error shown).

### Step 2 — Map Location Fields
- [ ] On file load, system fields auto-map to CSV headers using fuzzy hint matching.
- [ ] Required fields show a REQUIRED badge; optional fields show an OPTIONAL badge.
- [ ] Each field row has a dropdown listing all CSV headers plus "— Not mapped —".
- [ ] The selected dropdown value matches the auto-mapped column (or "— Not mapped —" if no match).
- [ ] Selecting a column in one field does not remove it from other fields' dropdowns (same column can map to multiple system fields).
- [ ] NEXT is disabled unless both External ID and Location Name are mapped.
- [ ] When Status is mapped, the Status Value Mapping sub-section appears.
- [ ] The sub-section lists each distinct value in the status column with its row count and a classification dropdown (Active / Inactive).
- [ ] Values matching "closed" or "inactive" (case-insensitive) are auto-classified as Inactive; all others as Active.
- [ ] Values not matching "active", "inactive", or "closed" show an amber warning icon.

### Step 3 — Define Hierarchy Levels
- [ ] Available columns list excludes any column already mapped as a system field.
- [ ] Clicking an available column appends it as the last hierarchy level.
- [ ] Dragging an available column into the levels list inserts it at the correct position (indicated by a blue drop-target bar).
- [ ] Dragging a level card reorders it within the list.
- [ ] Dragging a level card back to the Available Columns panel removes it from the hierarchy.
- [ ] Each level card is visually indented 20px × its position index.
- [ ] Each level card shows the level label, and if renamed, the source column name as "from: [column]".
- [ ] Clicking the level label activates an inline text input; Enter/Escape/blur commits the edit.
- [ ] A pencil icon appears on level card hover next to the label.
- [ ] The disclosure row shows the count of distinct values for the column; expanding it lists each value with its row count.
- [ ] Values with a count of 1 show an amber warning icon.
- [ ] The X button removes the level; it turns red on hover.
- [ ] NEXT is disabled when zero hierarchy levels are defined.
- [ ] The Hierarchy Preview panel appears in the right column on Step 3.
- [ ] PREVIEW button is disabled when zero levels are defined.
- [ ] Clicking PREVIEW builds and renders the hierarchy tree.
- [ ] The button label changes to UPDATE after the first preview.
- [ ] If hierarchy levels change after a preview, a stale warning banner appears in the panel.
- [ ] The tree renders the org name as the root, with hierarchy folder nodes and location leaf nodes.
- [ ] Folder nodes are expand/collapse toggleable; location nodes are not.
- [ ] Non-bottommost folder levels expand by default; bottommost folder level collapses by default.

### Step 4 — Location Attributes
- [ ] Available columns exclude system-mapped fields and hierarchy level columns.
- [ ] All qualifying columns are pre-selected by default.
- [ ] Each row shows the column name and total row count as the value count.
- [ ] Clicking a checkbox row toggles selection.
- [ ] "Select all" selects all; once all selected, label changes to "Deselect all" which clears all.
- [ ] NEXT is always enabled (zero attributes is valid).
- [ ] When a file is loaded with no remaining columns after field mapping and hierarchy, shows "No remaining columns to import as attributes."

### Step 5 — Preview & Commit
- [ ] Stat cards show: Locations (unique External IDs), Org Units (distinct hierarchy path nodes), Attributes (selected count), Ungrouped (locations with incomplete hierarchy).
- [ ] Ungrouped stat card value appears in red when > 0.
- [ ] Blocking errors section appears if duplicates, blank External IDs, or blank Location Names exist.
- [ ] Blocking errors list each issue with the count of affected rows.
- [ ] When blocking errors exist, the commit section (green check + button) is hidden.
- [ ] Warnings section appears if ungrouped count > 0.
- [ ] Warning acknowledgment checkbox is required before COMMIT IMPORT enables.
- [ ] No warnings or errors → COMMIT IMPORT is enabled immediately.
- [ ] COMMIT IMPORT shows a loading state ("IMPORTING…") while the API call is in flight.
- [ ] On API success, navigates to `/admin/org`.
- [ ] On API failure, shows an error and re-enables the button.

### Navigation
- [ ] Left sidebar shows all 5 steps with correct visual states (completed / active / locked).
- [ ] Completed steps are clickable and navigate directly to that step.
- [ ] Locked steps are not clickable.
- [ ] Sticky footer BACK on Step 1 says "CANCEL" and navigates to `/admin/org`.
- [ ] BACK on Steps 2–5 navigates to the previous step.
- [ ] NEXT is disabled until `canAdvance()` returns true for the current step.
- [ ] Step 5 has no NEXT button.

---

## Test cases

**Happy path:**
1. Navigate to import page. Modal appears. Enter org name, click CONTINUE. File browser opens.
2. Select a valid CSV with columns: StoreID, StoreName, Region, District, Address, City, State, Status. File loads. Zone shows filename, row count, column count. Detected Columns shows 8 chips.
3. Step 2 auto-maps: External ID → StoreID, Location Name → StoreName, Address → Address, City → City, State → State, Status → Status. Status Value Mapping shows distinct values from Status column.
4. Map Status values to Active/Inactive as needed. Both required fields are mapped → NEXT enables. Click NEXT.
5. Step 3: Available columns shows Region, District (Address/City/State not shown — already mapped). Drag Region into hierarchy levels → one level card appears. Drag District → two level cards. Cards are indented 0px and 20px respectively. NEXT enables. Click PREVIEW — tree renders. Click NEXT.
6. Step 4: Available columns = none (Address, City, State were mapped; Region, District are hierarchy). Shows "No remaining columns" message or an empty state. Click NEXT.
7. Step 5: Stat cards show correct counts. No errors. No warnings (if all rows have Region and District values). COMMIT IMPORT is enabled. Click it → loading state → navigate to `/admin/org`.

**State/variant cases:**
- Empty drop zone: No file loaded — NEXT is disabled. Zone renders cloud-upload icon and helper text.
- Drag highlight: Dragging a CSV over the upload zone changes border to blue and background to light blue.
- Replace file: After loading a file, clicking "Replace file" opens the file browser. Selecting a new file replaces all state (csv, mapping, hierarchy, attributes reset from the new file).
- Auto-map miss: CSV headers have no match for any system field hints → all fields default to "— Not mapped —". NEXT stays disabled.
- Status not mapped: Status Value Mapping sub-section does not appear.
- Hierarchy levels reordered: Drag a level card up/down. Card repositions and indentation updates accordingly. If preview exists, stale warning banner appears.
- Level label renamed: Click label, type new name, press Enter. Card shows new name + "from: [original column]" subtitle.
- Hierarchy preview stale warning: After a preview is generated, add or remove a level → amber banner appears in preview panel. Clicking UPDATE regenerates the tree and clears the banner.
- All attributes deselected: Step 4 "Deselect all" clears all checkboxes. NEXT still enables. Step 5 shows Attributes = 0.
- Blocking errors present: CSV has duplicate StoreID values and some blank StoreIDs → Step 5 shows red error block listing both issues. Commit section (green check + button) is hidden entirely.
- Ungrouped locations: Some rows have a blank District value → Step 5 shows Ungrouped count in red. Warning block appears. COMMIT IMPORT is disabled until acknowledgment checkbox is checked.
- API failure on commit: Server returns error → button re-enables, error message shown inline. "IMPORTING…" state reverts to "COMMIT IMPORT".

**Negative cases:**
- Clicking a locked step in the left sidebar does nothing (no navigation, no error).
- Uploading a non-CSV file via drag-and-drop → file is silently ignored; upload zone does not change state.
- Attempting NEXT on Step 3 with zero hierarchy levels → NEXT button is disabled; no error message needed.
- CONTINUE in modal with blank Org Name → action does not proceed.
- File with zero data rows (headers only) → wizard should treat as empty (no rows, no distinct values, all step-5 counts = 0).

---

## Success signals
An admin can upload a CSV, map it to the system schema, define a multi-level org hierarchy, and commit the import in a single flow without needing help or making a support request. After commit, the org scope page reflects the imported hierarchy with locations correctly nested under their org units.

---

## Reference materials
- `OrgHierarchyImportPage.tsx` — the prototype this spec was reverse-engineered from. Illustrates the full 5-step layout, card designs, preview panel behavior, validation states, and tree rendering. Treat as the visual reference; do not copy code directly.
- The tree renders using a custom recursive component — the target stack may use a tree library instead.

---

## Scope
**In:**
- The 5-step import wizard (modal, upload, field mapping, hierarchy definition, attribute selection, preview & commit)
- CSV parsing with quoted-field support
- Auto-mapping of system fields using hint matching
- Drag-and-drop hierarchy level builder with inline label editing
- Live hierarchy preview panel (Steps 3–5)
- Status value classification mapping
- Validation: blocking errors (duplicate IDs, blank IDs, blank names) and warnings (ungrouped locations)
- Commit via API call with loading and error states

**Out:**
- Incremental / delta imports (this wizard always replaces the full hierarchy)
- Editing the hierarchy after import (that is the OrgScopePage responsibility)
- File formats other than CSV
- Preview of the full location list (only the tree structure is previewed)
- Undo / rollback of a committed import from within the wizard
- Permissions and role-gating (assume the user has admin rights to reach this page)

---

## Additional context

**Column exclusion rule:** A CSV column can serve exactly one purpose. Columns mapped as system fields (Step 2) are excluded from the hierarchy column picker (Step 3) and the attribute list (Step 4). Columns assigned as hierarchy levels are excluded from the attribute list (Step 4). This is enforced across all steps — changing mappings in Step 2 automatically updates what's available in Steps 3 and 4.

**Attribute pre-selection:** When a file is loaded, all columns not consumed by auto-mapping are immediately pre-selected as attributes. This pre-selection updates dynamically as the user changes field mappings or hierarchy levels.

**Hierarchy tree construction:** The tree is built by iterating all CSV rows. For each row, the system walks the hierarchy levels in order, creating intermediate folder nodes for each distinct value combination. If a row has a blank value at any hierarchy level, that location is placed in an Ungrouped bucket instead. Duplicate External IDs: only the first occurrence is placed in the tree; subsequent rows with the same ID are silently ignored in the tree builder, but the Step 5 validation catches and flags them as blocking errors before the user can commit.

**Org name as root node:** The org name entered in the modal becomes the root node label in the preview tree and the root of the committed hierarchy. It does not appear anywhere in the CSV.

**Audit record:** The commit action generates an audit record on the backend. The UI surfaces this only as a note below the commit button. No further audit UI is in scope here.

**sessionStorage (prototype artifact):** The prototype stores the import result in `sessionStorage` for the OrgScopePage to pick up. This is a prototype-only handoff — the real implementation should use an API response and standard navigation.

---

## Open questions
- Should the wizard support re-entry / resumption if the user navigates away mid-flow and returns? → **Answer: agent decides** — treat as a fresh session; no resume is required. A browser-tab-close warning (unsaved changes) is a nice-to-have if easy, but not required.
- What is the API contract for the commit endpoint (payload shape, response, error codes)? → **Answer: agent decides** — the implementing team defines the API. The spec describes the data that must be included: org name, list of locations with external ID, name, all mapped field values, hierarchy level path, attribute values, and status classification mapping.
- Should the stale-data warning in the preview panel also appear when the field mapping (Step 2) changes? → **Answer: agent decides** — the preview depends on the External ID and Location Name mappings, so yes, mapping changes that affect those fields should also trigger the stale warning.
