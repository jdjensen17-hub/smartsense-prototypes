# Location Attribute Manager

## Intent
Admins need a way to see all locations in one place, filter them by their attribute values, and update those values per location without leaving the list. Without this, finding and correcting attribute gaps across hundreds of locations requires navigating to each location individually. The primary persona is an admin responsible for keeping location data current. This lives in the Admin module at `/admin/location-tags`.

## Module
admin

## User journey

### Landing — location list
The page opens to a full list of locations with a stat row, filter controls, a search bar, and a paginated table.

**Stat row (top of page, three cards):**
- **Locations** — total count of all locations in the system. Static, always shows the full fleet count.
- **Selected** — count of locations currently matching the active filters. Displays 0 and appears muted when no filters are active; switches to a blue highlighted card showing the filtered count when any filter is active (search, attribute filters, or Needs Attention).
- **Need Attention** — count of locations missing at least one attribute value. Always amber-styled. Clicking this card toggles a "Needs Attention" filter on/off. When active, the card shows a filled/active state.

**Filter controls (right of stat row):**
- **Attributes button** — opens the Filter Drawer. Label is "ATTRIBUTES" when no attribute filters are active; shows "ATTRIBUTES (N)" when N attribute filters are applied. Blue border/background when active.
- **Reset Filter button** — clears all active filters: search text, Needs Attention toggle, and all attribute filters. Resets pagination to page 1.
- **Active filter chips** — appear below the buttons when any filters are applied. Each chip shows what is filtered and has an X to dismiss it individually:
  - Needs Attention chip: red/danger style ("Need attention")
  - Attribute filter chips: blue style, label format is `AttributeName: value1, value2`

**Search bar:**
Full-width text input below the controls. Searches across store ID, name, street address, city, state, zip, and phone. Resets pagination to page 1 on each change. Border highlights blue on focus.

**Location table:**
A grid table with six columns: Open | Store ID | Location Name | Street Address | City/ST/ZIP | Phone.

- The Open column header shows an open-in-new icon (non-interactive). Each data cell shows a blue open-in-new icon — clicking it opens the Location Edit Drawer for that row.
- Store ID column: locations flagged "Needs Attention" show a small red dot before the store ID.
- All text cells truncate with ellipsis on overflow.
- Rows highlight on hover.
- Empty state: "No locations match the current filters. Try adjusting or removing a filter."

**Pagination:**
15 rows per page. Previous / Next text buttons below the table. Buttons are disabled (grayed) when at the first or last page respectively. Center label shows "Page N of N."

---

### Filter Drawer — filter by attribute
Opens from the Attributes button. Slides in from the right as a full-height panel (600px wide) with a semi-transparent backdrop. Clicking the backdrop closes the drawer without applying pending changes.

**Header:**
- X close button (left)
- "Filter by Attribute" title (center)
- CLEAR ALL button — clears all pending filter selections without closing the drawer
- APPLY button — applies pending filters, closes the drawer, resets pagination to page 1. Label shows "APPLY" when no pending values selected, "APPLY (N)" when N pending filter values are staged.

**Match count mini-card:**
Below the header. Shows "0 Selected" in a muted state when no pending filters are set. When pending filters are active, shows the live count of locations that would match if applied, in a blue highlighted card. Updates in real time as the user adjusts pending selections.

**Two-panel body:**

*Left panel — attribute list (260px):*
- Search input at the top to filter the attribute list by name.
- Each attribute row shows the attribute name, a blue count badge (number of pending filter values for that attribute), and a right chevron.
- Clicking a row selects it and opens its value options in the right panel. Clicking the selected row again deselects it (right panel shows empty state).
- Selected row: blue background. Rows with pending values but not selected: green tint background.

*Right panel — value picker (remaining width):*
- When no attribute is selected: shows "Select an attribute to filter the list" centered.
- When an attribute is selected: shows the attribute name as a header. If any values are pending for this attribute, a CLEAR button appears to remove all selections for it.
- Value options list (scrollable):
  - **Any value** — matches locations where this attribute is set to anything (has a value)
  - **Not set** — matches locations where this attribute has no value
  - For Boolean attributes: **Yes**, **No**
  - For Enum attributes: each defined enum value
  - Each option is a checkbox row. Checking "Any value" or "Not set" clears all other selections for this attribute (they are mutually exclusive with everything else). Enum/Boolean values can be combined (OR logic within one attribute).

**Filter logic:**
- Within one attribute filter: multiple values are combined with OR (location matches if its value matches any selected option).
- Between different attribute filters: combined with AND (location must satisfy all active attribute filters).
- Pending filter state is a draft — nothing changes in the main list until APPLY is clicked.
- Opening the drawer initializes pending state from the current active filters, so the user sees the current applied state.

---

### Location Edit Drawer — edit a single location's attributes
Opens when clicking the open-in-new icon on any table row. Slides in from the right (600px wide, full height) with a semi-transparent backdrop. Clicking the backdrop or pressing Escape closes the drawer. Search state resets when the drawer closes.

**Header:**
- X close button (left)
- Location name (center, bold, truncated with ellipsis if long)
- Vertical kebab menu (right): one option — "Edit location" — opens the location's full admin detail page in a new browser tab. The kebab button highlights on hover.

**Location info section:**
Two-column grid below the header:
- Store ID (left), Phone (right)
- Address (full width, below, spans both columns)
Each field has an uppercase label and the value below it.

**Attribute search:**
Text input with a search icon. Filters the attribute list below to names matching the query. An X clear button appears inside the input when text is present; clicking it clears the query. Border highlights blue on focus.

**Attribute list (scrollable):**
Attributes are grouped into two sections, separated by section headers:

- **"NOT SET — N attribute(s)"** header (red/danger background): all attributes that currently have no value for this location, matching the search query.
- **"CONFIGURED — N attribute(s)"** header (light gray background): all attributes that have a value set, matching the search query.

Each attribute row shows:
- Attribute name (left)
- "Saved" confirmation text in green below the name — appears for 1.2 seconds after any change to that attribute, then disappears.
- Edit control (right), by value type:

  **Boolean:**
  - "Yes" and "No" toggle buttons side by side.
  - The active value's button shows a blue border and blue background.
  - Clicking the active button deselects it (clears the value, same as clearing).
  - A "Clear" button appears to the right of Yes/No when a value is set; clicking it removes the value.

  **Enum:**
  - Custom select dropdown showing the current value or "— Not set —" as placeholder.
  - Dropdown opens below the control, lists "— Not set —" as the first option (italic, clears the value), then all defined enum values.
  - Selected option has a blue checkmark and blue background in the list.

  **Numeric:**
  - A number input field. The user types a numeric value directly.
  - Clearing the input removes the value.

**Save behavior:**
All changes save immediately on interaction (no explicit save button). The "Saved" flash confirms each write. The drawer can be closed at any time — there is no unsaved-changes warning.

---

## Acceptance criteria

### Location list
- [ ] The page shows Locations, Selected, and Need Attention stat cards on load.
- [ ] "Locations" always shows the total fleet count; it does not change when filters are applied.
- [ ] "Selected" shows 0 (muted) with no active filters; shows the filtered count (blue) when any filter is active.
- [ ] "Need Attention" shows the count of locations missing at least one attribute value.
- [ ] Clicking the Need Attention card toggles the Needs Attention filter on/off.
- [ ] When Needs Attention is active, the table shows only those locations; the Selected card updates.
- [ ] The Attributes button label shows "ATTRIBUTES" with no active attribute filters; "ATTRIBUTES (N)" with N active filters.
- [ ] The Attributes button has a blue border and background when attribute filters are active.
- [ ] Reset Filter clears search text, Needs Attention toggle, and all attribute filter chips simultaneously.
- [ ] Active filter chips appear when any filter is active (Needs Attention chip and/or attribute chips).
- [ ] Each chip has an X to remove that filter individually without affecting others.
- [ ] The Needs Attention chip is red/danger styled; attribute chips are blue styled.
- [ ] Attribute chip label format: `AttributeName: value1, value2`.
- [ ] The search bar filters rows by store ID, name, street, city, state, zip, or phone (any field match).
- [ ] Typing in the search bar resets pagination to page 1.
- [ ] The table shows 15 rows per page.
- [ ] Previous and Next pagination buttons disable when at the first and last page respectively.
- [ ] Locations flagged as Needs Attention (missing any attribute value) show a red dot before their store ID.
- [ ] Clicking the open-in-new icon on a row opens the Location Edit Drawer for that location.
- [ ] Hovering a row highlights it.
- [ ] When no rows match the current filters, the empty state message is shown.

### Filter Drawer
- [ ] The drawer slides in from the right; a backdrop appears behind it.
- [ ] Clicking the backdrop closes the drawer without applying pending changes.
- [ ] The drawer header shows X close, title, CLEAR ALL, and APPLY buttons.
- [ ] Opening the drawer initializes pending state from the currently applied filters.
- [ ] The match count card shows "0 Selected" (muted) when no pending values are selected.
- [ ] The match count card shows the live matching location count (blue) when pending filters are set.
- [ ] The attribute search field in the left panel filters the attribute list by name.
- [ ] Clicking an attribute in the left panel opens its value options in the right panel.
- [ ] An attribute row shows a blue count badge when it has pending selections.
- [ ] An attribute row shows a green tint background when it has pending selections and is not currently selected.
- [ ] The right panel shows "Select an attribute to filter the list" when no attribute is selected.
- [ ] Each value option in the right panel has a checkbox.
- [ ] Selecting "Any value" or "Not set" clears all other selections for that attribute.
- [ ] Multiple enum/Boolean values can be selected simultaneously for one attribute (OR logic).
- [ ] The CLEAR button in the right panel header removes all pending selections for the current attribute.
- [ ] CLEAR ALL removes all pending selections across all attributes.
- [ ] APPLY applies the pending filters to the main list, closes the drawer, and resets to page 1.
- [ ] When no pending filters are set, APPLY label is "APPLY"; when N values are pending, label is "APPLY (N)".

### Location Edit Drawer
- [ ] The drawer slides in from the right; a backdrop appears behind it.
- [ ] Clicking the backdrop closes the drawer.
- [ ] Pressing Escape closes the drawer.
- [ ] The drawer header shows the location name, X close, and a kebab menu.
- [ ] The kebab "Edit location" option opens the location's detail page in a new browser tab.
- [ ] The location info section shows Store ID, Phone (two columns), and full address (full width).
- [ ] The attribute search field filters the attribute list by name.
- [ ] The X clear button appears in the search field when text is present; clicking it clears the query.
- [ ] Attributes with no value appear under the "NOT SET" section header (red/danger).
- [ ] Attributes with a value appear under the "CONFIGURED" section header (gray).
- [ ] Section headers show the count of attributes in that section.
- [ ] Boolean attributes show Yes and No toggle buttons; the active value is visually highlighted.
- [ ] Clicking the active Boolean value deselects it (clears the attribute).
- [ ] A Clear button appears for Boolean attributes when a value is set; clicking it removes the value.
- [ ] Enum attributes show a custom dropdown with "— Not set —" as the first option.
- [ ] Selecting "— Not set —" from the dropdown clears the attribute value.
- [ ] Numeric attributes show a number input field. Clearing the input removes the value.
- [ ] Any change saves immediately — no explicit save button.
- [ ] A "Saved" green confirmation text appears below the attribute name for 1.2 seconds after each change.
- [ ] After a save, the attribute moves between "NOT SET" and "CONFIGURED" sections as appropriate.
- [ ] The attribute search query resets when the drawer closes.

---

## Test cases

**Happy path — filter and edit:**
1. Page loads showing all locations. Locations card shows total fleet count. Selected = 0. Need Attention = N.
2. Click "Need Attention" card → table filters to only those locations; Selected card turns blue with that count; Needs Attention chip appears.
3. Click "ATTRIBUTES" → filter drawer opens. Left panel lists all attributes. Right panel shows empty state.
4. Click an enum attribute → right panel shows value options. Select one value → match count card updates live with matching count.
5. Click APPLY → drawer closes; table shows filtered results; an attribute chip appears ("AttributeName: selected-value"). Selected card updates.
6. Click the open-in-new icon on a row → Location Edit Drawer opens. Header shows location name. Info section shows store ID, phone, address.
7. Attribute list shows "NOT SET — N attributes" section in red and "CONFIGURED — N attributes" section in gray.
8. Click "Yes" on a Boolean attribute → button highlights; "Saved" flash appears and disappears after 1.2s; attribute moves from NOT SET to CONFIGURED.
9. Press Escape → drawer closes.

**State/variant cases:**
- No filters active: Selected card shows "0" in muted state. Reset Filter is available but a no-op.
- Needs Attention filter active + attribute filter active: both filters AND together; both chips visible; Reset Filter clears both at once.
- Search with no matches: empty state message shown. Pagination shows "Page 1 of 1."
- Attribute chip X dismiss: removes only that attribute's filter; other filters remain; Selected card updates.
- CLEAR ALL in filter drawer: all pending selections cleared; match count drops to 0; APPLY button shows "APPLY" (no count).
- Open filter drawer with existing active filters: pending state initializes to match currently applied filters. User sees their current selections already checked.
- Location has all attributes set: NOT SET section is absent; CONFIGURED section shows all attributes.
- Location has no attributes set: CONFIGURED section is absent; NOT SET section shows all attributes.
- Attribute search in drawer filters attribute list: non-matching attribute names disappear from both sections.
- Boolean Clear button: appears only when a value is set. Clicking it removes the value; attribute moves to NOT SET; "Saved" flashes.
- Enum "— Not set —" selected: value is cleared; attribute moves to NOT SET.
- Numeric attribute: shows a number input. Entering a value saves immediately. Clearing the input removes the value.
- Kebab "Edit location": opens location detail in a new tab without closing the drawer.

**Negative cases:**
- Clicking the backdrop behind the filter drawer cancels pending selections — active filters on the main page are unchanged.
- Pagination resets to page 1 whenever any filter or search changes.
- Needs Attention count does not include locations where all attributes are set.
- The Attributes button count badge reflects applied filters, not pending; it only updates after APPLY.
- Removing an attribute chip does not reset the search or Needs Attention toggle.

---

## Success signals
An admin can open this page, immediately see which locations need attention, drill into a filtered subset using one or more attribute filters, open a specific location's drawer, and correct missing or incorrect attribute values — all in a single flow without navigating away from the list. After saving, the location's attribute completeness reflects in the page immediately.

---

## Reference materials
- `LocationTagManagementPage.tsx` — the prototype this spec was reverse-engineered from. Contains the full page layout, filter drawer, and location edit drawer. Use as the visual reference.
- `App.tsx` (user-management) — the shell context: sticky header, hamburger nav drawer with Admin/Operate accordions, avatar menu. This feature lives at `/admin/location-tags` under the Admin nav section.

---

## Scope
**In:**
- Location list table with search and pagination
- Stat row: Locations, Selected, Need Attention
- Need Attention filter toggle (locations missing any attribute value)
- Attribute filter drawer (multi-attribute, multi-value, pending/apply pattern)
- Active filter chips with individual dismiss
- Reset Filter button
- Location Edit Drawer: location info, attribute list (grouped by set/unset), Boolean/Enum/Numeric edit controls, auto-save with flash confirmation
- "Edit location" external link from the drawer kebab

**Out:**
- LocationAttributesPage (attribute definition management)
- CreateAttributeDrawer (create/edit attribute definitions)
- The attribute data model itself (attribute definitions, enum values, etc.) — assumed to exist
- Any read/write API contracts — implementing team defines these
- "View usage" on attribute rows (not in this feature)

---

## Additional context

**Need Attention definition:** A location is flagged as Needs Attention when it is missing a value for one or more attributes. This should be computed dynamically from the attribute data, not from a hardcoded list. The stat card count and the red dot in the table both derive from this same condition.

**Auto-save pattern:** The Location Edit Drawer has no save or cancel button. Every control interaction (button click, dropdown selection, numeric input change) immediately writes the value. The 1.2-second "Saved" flash is the only confirmation. Closing the drawer at any point does not discard changes — there is nothing pending.

**Attribute sections reorder on save:** When a user sets an attribute value in the NOT SET section, that attribute should move to CONFIGURED immediately after saving. When a value is cleared from CONFIGURED, it should move to NOT SET. The move should be reflected without requiring a drawer close/reopen.

**Filter drawer is a "pending" pattern:** Unlike the auto-save in the edit drawer, the filter drawer is explicitly staged. The user can make selections across multiple attributes, see the live match count update, and then either apply or abandon. This prevents the main list from jumping around while the user is composing a complex filter.

**Filter logic:**
- Within one attribute: OR (location matches if its value matches any of the selected options for that attribute)
- Between attributes: AND (location must satisfy all active attribute filters simultaneously)
- "Any value" matches any location where the attribute has a value set (is not unset)
- "Not set" matches any location where the attribute has no value
- "Any value" and "Not set" are mutually exclusive with each other and with specific values — selecting either clears other selections for that attribute

**Attribute types in scope for the edit drawer:**
- Boolean: Yes / No toggle with Clear
- Enum: custom dropdown with "— Not set —" option
- Numeric: number input, clear by emptying the field

---

## Open questions
- Should the Needs Attention filter interact with the attribute filter (AND), or should it be a parallel, independent filter? → **Answer:** AND — a location must satisfy both the Needs Attention condition and any attribute filters to appear in the filtered results (this is what the prototype code implements).
- Should the attribute search in the edit drawer search across both the NOT SET and CONFIGURED sections simultaneously, or only the active section? → **Answer: agent decides** — the prototype searches both sections simultaneously; this is the expected behavior unless the implementing team has a strong reason to change it.
- When all attributes for a location are set (nothing in NOT SET), should the drawer show a success state or just show the CONFIGURED section alone? → **Answer: agent decides** — showing only the CONFIGURED section is sufficient; no explicit success/empty state is needed for the NOT SET section.
