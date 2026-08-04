# List Template Distribution

## Intent
Admins need to control which locations receive a given list template — not every template is relevant to every location. Without a distribution rule builder, templates either go everywhere or require manual per-location assignment. This feature lets admins compose targeting rules using org hierarchy nodes, location attributes, or a blanket all-locations option. It lives on the Distribution tab of the list template detail view in the Admin module.

## Module
admin

## User journey

### Entry point
The Distribution tab is one of three tabs on a list template's detail page (Items | Settings | Distribution). The tab bar and page header are shared across all tabs; only the Distribution tab content is in scope for this spec.

**Page header (full-width, always visible):**
- **Left:** Back arrow button + the template name (e.g., "Pizza Temperature Log"). The back arrow navigates to the list of templates.
- **Center (absolutely positioned):** The Reach Box — a live summary of how many locations the current rule set covers.
- **Right:** Save button + vertical kebab (more options).

**Reach Box:**
- Shows a store icon alongside the reach copy.
- When reach > 0: "Will be sent to **N** locations" (N is bold).
- When reach = 0: "Not assigned to any locations" (muted).
- An info icon with a hover tooltip: "Counts active locations with an Operate or Guard license."
- Updates live as rules and conditions change.

**Save button:**
- Active (blue) when unsaved changes exist.
- Disabled (gray, non-interactive) when no changes have been made since last save.

---

### Empty state — no rules defined
When no rules exist, the content area shows a centered empty state:
- Broadcast icon
- Heading: "No locations will receive this template."
- Subtext: "Add a rule to define which locations receive this template."
- Two actions:
  - **ADD RULE** — outline button, adds a new empty rule and shifts to the rules view.
  - **ASSIGN TO ALL LOCATIONS** — link-style button, adds a single rule pre-populated with an "All Locations" condition (covers the entire fleet). Shortcut for the most common setup.

---

### Rules view — one or more rules defined
Once rules exist, the empty state is replaced by the rules list. Rules are displayed vertically, separated by an **OR** divider (a horizontal rule with "OR" label centered in it). Below the last rule, a "+ ADD RULE" link button adds another rule.

**Logic model:**
- A location receives the template if it matches **any** rule (rules are OR'd).
- Within a single rule, a location must match **all** conditions (conditions within a rule are AND'd).

---

### Rule card
Each rule renders as a white card with a blue border accent (1px border, 4px radius).

**Card header:**
- Left: "Rule N" label (1-indexed, uppercase, muted gray).
- Right: DELETE button — muted gray text, turns red with a red tint background on hover. Clicking it removes the rule entirely.

**Conditions (when one or more exist):**
A subheading appears: "Location must match ALL of the following:"

Each condition renders as a row containing:
- **Type badge** (fixed-width column, ~115px): pill-shaped badge indicating the condition type:
  - *All Locations* — green tint
  - *Org Node* — blue tint
  - *Attribute* — orange tint
- **Condition name** — the selected value (e.g., "East Division", "Drive-Thru", "All Locations").
- **Location count** — e.g., "210 locations" (muted, right-aligned before the remove button).
- **× remove button** — removes this condition from the rule. Gray, turns red on hover.

**Condition picker (always shown unless the rule has an "All Locations" condition):**
A prompt label "Select a condition type for this rule:" followed by three type chips:

1. **ALL LOCATIONS** — clicking immediately adds an All Locations condition to the rule. Disabled (grayed, not-allowed cursor) if the rule already has an All Locations condition.
2. **ORG NODE** — clicking transitions the picker to the search step for org nodes.
3. **ATTRIBUTE** — clicking transitions the picker to the search step for attributes.

When a rule contains an "All Locations" condition, the condition picker is hidden entirely (no further conditions can be added — All Locations already covers everything).

**Condition picker — search step (org node or attribute):**
After selecting ORG NODE or ATTRIBUTE, the type chips are replaced by:
- A text input (auto-focused) with a search icon. Placeholder text is "Search org nodes…" or "Search attributes…" respectively.
- A results dropdown directly below the input (max 200px height, scrollable):
  - Each result shows the name (bold, larger) and a sublabel (e.g., "Division · 210 locations" or "Location attribute").
  - Clicking a result adds that condition to the rule and immediately resets the picker back to the type chip step.
  - Empty state: "No results."
- There is no explicit back/cancel button. Selecting a result is the only way to exit the search step. If the user wants to abandon the search, they must select a result or delete the rule.

**Condition count within a rule:** No hard limit is specified. The same org node or attribute can be added multiple times to a rule (the prototype does not deduplicate).

---

### Reach calculation
The Reach Box computes an estimated count of locations that the full rule set covers. This is a live client-side calculation in the prototype, intended to give admins a real-time sense of coverage while editing.

**Prototype approximation logic (for reference):**
- Per rule: multiply the fleet ratios of each condition's location count (treats conditions as independent intersections).
- Across rules: compute the union using `1 - ∏(1 - ratio_i)` (treats rules as independent).
- Multiply the resulting ratio by the total fleet count and round to the nearest integer.

**Real system:** Reach should be computed server-side from actual location data. The client-side approximation is a prototype placeholder only. The API should return an actual count when rules are submitted or when changes are staged. The UI simply displays whatever count the server returns.

---

## Acceptance criteria

### Page header
- [ ] The back arrow navigates to the list of templates.
- [ ] The template name is displayed next to the back arrow.
- [ ] The Reach Box is centered in the header, absolutely positioned between the left and right groups.
- [ ] The Reach Box shows "Not assigned to any locations" when reach is 0.
- [ ] The Reach Box shows "Will be sent to N locations" (N bold) when reach > 0.
- [ ] Hovering the info icon shows the tooltip: "Counts active locations with an Operate or Guard license."
- [ ] The Save button is blue and active when unsaved changes exist.
- [ ] The Save button is gray and non-interactive when no unsaved changes exist.

### Empty state
- [ ] When no rules exist, the empty state is shown (broadcast icon, heading, subtext, two action buttons).
- [ ] ADD RULE creates a new empty rule and renders the rules view.
- [ ] ASSIGN TO ALL LOCATIONS creates a rule with a single "All Locations" condition pre-populated.

### Rules view
- [ ] Each rule renders as a card.
- [ ] Multiple rules are separated by an "OR" divider.
- [ ] "+ ADD RULE" link button below the rules list adds a new empty rule.
- [ ] Rules are numbered sequentially from 1 (Rule 1, Rule 2, etc.).

### Rule card
- [ ] The DELETE button removes the rule. Its text and background turn red on hover.
- [ ] Deleting the last rule returns the page to the empty state.
- [ ] When a rule has one or more conditions, the subheading "Location must match ALL of the following:" is visible.
- [ ] Each condition row shows: type badge, condition name, location count, and × remove button.
- [ ] The × remove button removes that condition from the rule. It turns red on hover.
- [ ] Removing a condition from a rule does not delete the rule.
- [ ] The condition picker (type chips) is shown when no "All Locations" condition is in the rule.
- [ ] The condition picker is hidden when the rule has an "All Locations" condition.
- [ ] The ALL LOCATIONS chip is disabled when the rule already contains an All Locations condition.
- [ ] Clicking ALL LOCATIONS immediately adds an All Locations condition (no search step).
- [ ] Clicking ORG NODE transitions to the org node search step.
- [ ] Clicking ATTRIBUTE transitions to the attribute search step.
- [ ] The search input is auto-focused when the search step opens.
- [ ] The results list filters as the user types.
- [ ] Each result shows the name and sublabel.
- [ ] Clicking a result adds the condition and resets the picker to the type chip step.
- [ ] When no results match the search query, "No results" is shown.
- [ ] After adding a condition (any type), the Reach Box updates to reflect the new reach.

### Save
- [ ] Making any change (add rule, delete rule, add condition, remove condition) marks the form as dirty and enables the Save button.
- [ ] Clicking Save (when active) persists the rule set and disables the Save button.

---

## Test cases

**Happy path — build a targeted rule:**
1. Navigate to the Distribution tab of a list template. Empty state shows.
2. Click ADD RULE. A rule card appears with no conditions. Reach Box shows "Not assigned to any locations."
3. Click ORG NODE. Search step opens, input is focused.
4. Type "East" — results filter to show "East Division" and "East Region." Click "East Division."
5. Condition is added: type badge "ORG NODE", name "East Division", "210 locations." Picker resets to type chips. Reach Box updates.
6. Click ATTRIBUTE. Type "Drive". Click "Drive-Thru."
7. Second condition added. Subheading reads "Location must match ALL of the following." Reach updates (AND logic: intersects East Division and Drive-Thru locations).
8. Click Save. Button turns gray.

**Happy path — assign to all locations:**
1. From empty state, click ASSIGN TO ALL LOCATIONS.
2. One rule appears with an "All Locations" condition. Reach Box shows full fleet count.
3. Condition picker is hidden (no further conditions can be added).
4. Click Save.

**Multi-rule OR logic:**
1. Add Rule 1 with condition: Org Node "East Division" (210 locations).
2. Click "+ ADD RULE." Rule 2 appears, separated by "OR" divider.
3. Add condition to Rule 2: Org Node "West Division" (198 locations).
4. Reach Box reflects union of both (approximately 408 but may vary based on overlap). Reach is higher than either rule alone.

**State/variant cases:**
- Empty rule (no conditions): Reach Box shows "Not assigned to any locations." Rule card shows no subheading and shows the full condition picker.
- All Locations added: Condition picker disappears from that rule card.
- All Locations chip when rule already has All Locations: chip is grayed out and not clickable.
- Search with no matches: "No results" shown in the dropdown.
- Delete only rule: Returns to empty state.
- Org node sublabel: "Division · 210 locations", "District · 24 locations", "Region · 87 locations" — all correctly display in the results list.
- Reach tooltip: hovering the info icon shows and hides the tooltip correctly.

**Negative cases:**
- Clicking a disabled ALL LOCATIONS chip has no effect.
- Save button with no changes is non-interactive (no event fires).
- Removing a condition from a rule does not collapse or delete the rule.
- Adding "All Locations" to one rule does not affect other rules or disable the picker on other rule cards.

---

## Success signals
An admin can open a list template's Distribution tab, define one or more location-targeting rules using any combination of org nodes, attributes, and all-locations conditions, see live feedback on estimated reach, and save the configuration. The result is that only the targeted locations receive the template.

---

## Reference materials
- `DistributionPage.tsx` — the prototype this spec was reverse-engineered from. Contains the full rule builder, condition picker, reach computation, and page layout. Use as the visual reference; do not copy the client-side reach computation logic into the real implementation.

---

## Scope
**In:**
- Distribution tab content: empty state, rule builder, condition picker (all three condition types), OR dividers, reach box, save button
- Page header: back navigation, template name, reach box placement, save + kebab
- Tab bar (render only — other tabs are out of scope)

**Out:**
- Items tab content
- Settings tab content
- The vertical kebab menu options (no-op in prototype; agent decides what goes there)
- Client-side reach approximation — the real system must compute reach server-side
- Deduplication of conditions within a rule (prototype allows duplicates; agent decides whether to enforce uniqueness)
- Any validation on save beyond what the agent determines is appropriate

---

## Additional context

**Rule/condition logic summary:**
- Rules → OR: a location qualifies if it satisfies at least one rule.
- Conditions within a rule → AND: a location must satisfy every condition in the rule.
- "All Locations" condition: immediately satisfies the rule for all locations in the fleet. Only one is allowed per rule. When present, no other conditions can be added to that rule.

**Reach is an estimate, not a guarantee:** The prototype uses a probabilistic approximation (independence assumption) to estimate reach from location counts alone. This is intentionally imprecise. In the real system, reach must be computed server-side by evaluating the rule set against the actual location dataset. The UI should display whatever count the server returns. Consider a loading/updating state while the count is being fetched after rule changes.

**Condition picker auto-reset:** After selecting an org node or attribute from the search results, the picker resets to the type chip step automatically. There is no explicit back/cancel button in the search step. If this is a UX concern for the implementing team, adding a "Cancel" or "← Back" affordance in the search step is a reasonable addition.

**Template name in header:** The template name is display-only on this tab. Renaming is presumably handled on the Settings tab (out of scope here).

**Kebab (more options):** The vertical dots button in the page header is present but has no menu in the prototype. The implementing team should determine what options belong here (e.g., duplicate template, delete template, view history).

---

## Open questions
- Should the system prevent saving if any rule has zero conditions (an empty rule contributes nothing to reach)? → **Answer: agent decides** — reasonable options are: (a) auto-remove empty rules on save, (b) show a validation warning, or (c) allow empty rules as a valid "draft" state.
- Can the same org node or attribute be added as a condition more than once within a single rule? → **Answer: agent decides** — the prototype allows duplicates; the implementing team should determine whether to deduplicate on add or on save.
- Should reach update immediately on every change (optimistic) or only after a short debounce/server round-trip? → **Answer: agent decides** — optimistic + debounced server fetch is the recommended pattern if reach is server-computed.
- What options should the vertical kebab in the page header contain? → **Answer: agent decides** — not in scope for this spec; the implementing team defines the options.
