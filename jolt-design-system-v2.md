# Jolt Design System Reference — v2
*Validated against live app (app.joltup.com) and (cdn.joltup.com/apps/lists-web-docs)*
*Session date: April 23, 2026*
*Supersedes: jolt-design-system.md (Storybook-only extraction)*

---

## How to use this document
This reference was built by scraping computed styles from the live Jolt app, not just Storybook. Where the two sources conflict, **the live app values are correct**. Storybook uses a dark shell with Nunito Sans — neither applies to production pages.

---

## MANDATORY — Color Source Rule

**All colors in any UI built in this project MUST come from the `@joltup/colors` package.** This is non-negotiable.

- Installed: `@joltup/colors@1.3.0` (run `npm install @joltup/colors@latest` to refresh)
- Import: `import colors from '@joltup/colors';`
- Use the tokens directly (Pattern 1) or via `LIST_COMPONENT_COLORS` from `THEME_LIGHT` / `THEME_DARK` (Pattern 2). See "Production Styling — Emotion Conventions" below.

### Hard rules
1. **No hardcoded hex values** in any styled component, inline style, or `style={{...}}` prop. If you find yourself typing `#`, stop — look up the token first.
2. **No raw RGB/HSL/named CSS colors** (`red`, `white`, `rgba(...)`) — use the `@joltup/colors` equivalent.
3. **No Tailwind color classes** (`bg-blue-500`, `text-gray-700`, etc.) — Tailwind is not the styling system in this project.
4. **Cross-reference the Appendix** (Hex-to-Token Mapping at the bottom of this doc) when translating from the validated hex values in this doc to `@joltup/colors` tokens.
5. **Exceptions are documented, not invented.** The only acceptable hex values are the partial-match list noted in the Appendix (shell-specific values like `#35353B`, `#555555`, `#3D4144`, `#6B7280`, `#181D1F`, `#9BA0B0`, `#BABABA`, `#5CA6D9`, `#CCCDD0`, `rgba(255,255,255,0.12)`) — and even those should be flagged with a comment explaining why a raw hex is required.

   - `rgba(255,255,255,0.12)` — translucent white hover/active 
     state on dark backgrounds (PDF viewer header, find bar). 
     No @joltup/colors equivalent.
6. **If a needed color is missing from `@joltup/colors`**, stop and ask Jim before adding a raw hex. Do not silently invent a new value.

### Self-check before completing any UI task
- [ ] Every color references `@joltup/colors` (directly or via `LIST_COMPONENT_COLORS`).
- [ ] No `#` literals in styled components (except the documented shell-only exceptions).
- [ ] No Tailwind color utility classes.
- [ ] Every styled component has a `label`.

---

## MANDATORY — Component Source Rule

**Whenever a UI element is needed, use components from `@joltup/lists-web-components` first.** Only build a custom component if the library has no equivalent or composition cannot achieve the requirement.

- Installed: `@joltup/lists-web-components@5.5.23` (run `npm install @joltup/lists-web-components@latest` to refresh)
- Import: `import { Button, Alert, Drawer, ... } from '@joltup/lists-web-components';` — named exports, single package
- Storybook reference: `https://cdn.joltup.com/apps/lists-web-docs/index.html?path=/story/[id]` (IDs listed at the bottom of this doc)

### Decision order — every time you add UI
1. Check if `@joltup/lists-web-components` has the component (table below).
2. If yes → use it. Configure via props. Do not re-implement.
3. If close-but-not-exact → compose library components (e.g. `Drawer` + `Button` + `Input`).
4. If no equivalent exists → build a custom Emotion component following the patterns in this doc, and flag it to Jim so we can decide whether to upstream it.

### Common UI element → library component

| UI element | Use this component |
|---|---|
| Primary / secondary / link / icon button | `Button` (props: `type='solid' \| 'outline' \| 'link' \| 'icon'`, `color`) |
| Group of related icon buttons | `ButtonIconGroup`, `IconButton` |
| Inline alert / banner / toast | `Alert`, `Banner`, `Snackbar` (use `AlertProvider` + `useAlert` for global toasts) |
| Modal / side panel | `Drawer`, `Dialog` (use `InformationDialog` for read-only info) |
| Data table / grid | `DataGrid`, `DataTable` (AG Grid wrapper) |
| Stat / summary card | `StatsCard`, `DashboardCard`, `DataCard`, `InfoCard` |
| Text input / number / textarea | `Input`, `NumberInput`, `TextArea`, `Field` (wrapper with label) |
| Select / multi-select / dropdown | `Select`, `MultiSelect`, `MultiSelectDropdown` |
| Checkbox / radio / toggle | `Checkbox`, `CheckboxGroup`, `Radio`, `SwitchToggle` |
| Chip / tag / filter pill | `Chip`, `FilterMenu`, `FilterBar`, `FilterMenuButton` |
| Search input | `SearchBar` (with `SearchResultsPane` for results) |
| Tabs / segmented control | `Tabs`, `Segment` |
| Date / time pickers | `DatePicker`, `DateRangePicker`, `TimeSelect`, `TimeRangeBuilder` |
| Menu / context menu | `Menu` |
| Tooltip | `Tooltip` |
| Loading state | `LoadingSpinner`, `LoadingLine` |
| Empty state | `EmptyState` |
| Pagination | `Paginator` |
| Header / toolbar / breadcrumbs | `Header`, `Toolbar`, `BreadCrumbBar` |
| Page shell / window | `WidgetShell`, `Window` |
| User avatar | `UserAvatar` |
| Charts | `BarGraph`, `LineGraph`, `DonutChart`, `InlineChart`, `PercentBar`, `Legend` |
| Form helper text / label | `HelperText`, `Label` |
| File upload | `FileDropzone`, `FileSelector` |
| Color / emoji / icon pickers | `ColorPicker`, `ColorIconPicker`, `EmojiPicker` |

> Full list lives in `node_modules/@joltup/lists-web-components/dist/index.d.ts` — check there if you're unsure whether a component exists before building one from scratch.

### Hard rules
1. **Do not re-implement** a library component (no custom Button, custom Drawer, custom Chip, etc.) without explicit sign-off from Jim.
2. **Do not pull in a third-party UI library** (MUI directly, Ant Design, Chakra, Radix, shadcn, etc.) to fill a gap — flag the missing component and ask first.
3. **Style overrides** on library components must still use `@joltup/colors` tokens (see Color Source Rule above).
4. **Wrap, don't fork.** If a library component needs project-specific behavior, wrap it in your own component that delegates to the library version. Do not copy its source.

### Self-check before completing any UI task
- [ ] Every primitive UI element (button, input, drawer, chip, table, card, etc.) comes from `@joltup/lists-web-components` where one exists.
- [ ] No bespoke re-implementations of library components.
- [ ] Any custom component built is flagged in the "Follow-up needed" section of the task summary.

---

## Production Styling — Emotion Conventions

*Added: May 2026. Validated against `lists-web-components` source in GitLab.*

> **See also:** [`STYLING.md`](./STYLING.md) — full Emotion patterns, nested selector conventions, file naming, and the complete `@joltup/colors` + `LIST_COMPONENT_COLORS` token reference. This section gives the rules; STYLING.md gives the depth.

The production Lists app uses **Emotion** (`@emotion/styled`) for all component styling — not Tailwind, not CSS modules, not inline styles. When writing production-ready components with Claude Code, always use Emotion.

### The two imports you always need

```js
import colors from '@joltup/colors';
import styled from '@emotion/styled';
```

### Two styling patterns — know which to use

**Pattern 1: Direct `@joltup/colors` — for static/structural components**

```js
import colors from '@joltup/colors';
import styled from '@emotion/styled';

const MyComponentStyle = styled.div({
  label: 'my-component',        // always include — shows in DevTools
  backgroundColor: colors.grey[100],
  color: colors.grey[900],
  border: `1px solid ${colors.grey[400]}`,
  borderRadius: '4px',
  padding: '8px 16px',
});
```

**Pattern 2: `LIST_COMPONENT_COLORS` theme — for interactive/stateful components**

Use this for anything with hover, active, disabled, focus, or error states. The theme object is injected via Emotion's theme context and falls back to `THEME_LIGHT`.

```js
import styled from '@emotion/styled';
import { THEME_LIGHT } from '../constants';

const defaultThemeColors = THEME_LIGHT.LIST_COMPONENT_COLORS;

const MyComponentStyle = styled.div(
  ({ theme: { LIST_COMPONENT_COLORS = defaultThemeColors } }) => ({
    label: 'my-component',
    color: LIST_COMPONENT_COLORS.BACKGROUND.CONTRAST_TEXT,
    border: `1px solid ${LIST_COMPONENT_COLORS.BORDER.LIGHT}`,
    '&:hover': {
      backgroundColor: LIST_COMPONENT_COLORS.BACKGROUND.TRASNPARENT_HOVER, // note: typo in source — use as-is
    },
    '&:disabled': {
      color: LIST_COMPONENT_COLORS.DISABLED.MAIN,
    },
  }),
);
```

> ⚠️ `TRASNPARENT_HOVER` / `TRASNPARENT_ACTIVE` are misspelled in the source constants. Use the misspelled versions — correcting them will break the reference.

### Always include a `label`

Every styled component should include a `label` matching the component name (kebab-case). This is what shows in browser DevTools and makes debugging tractable.

---

## Font Family
**Primary:** `Open Sans`, sans-serif
Load via Google Fonts: `https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap`

---

## Typography Scale — Validated Values

| Context | Size | Weight | Color | Notes |
|---|---|---|---|---|
| Page title (H1) | 24px | 400 | `#27B872` | Green, used in legacy Jolt pages |
| Shell / app name | 14px | 600 | `#35353B` | SmartSense ONE shell header |
| Page name in header | 14px | 400 | `#35353B` | After vertical separator in shell header |
| Drawer title | 20px | 700 | `#555555` | Letter spacing: 0.25px, line-height: 28px |
| Table header cell | 13px | 700 | `#3D4144` | Not `#181D1F` — slightly lighter in practice |
| Table body cell (primary) | 14px | 400 | `#181D1F` | Store ID, Location Name |
| Table body cell (secondary) | 14px | 400 | `#555555` | Street, City columns |
| Table body cell (tertiary) | 14px | 400 | `#6B7280` | Phone numbers, muted data |
| Section label / field label | 10px | 700 | `#6B7280` | ALL CAPS, letter-spacing: 0.08em |
| Body text | 16px | 400 | `#555555` | General paragraph content |
| Caption / helper | 12px | 400 | `#6B7280` | — |
| Button (solid/outline) | 13–14px | 500 | varies | UPPERCASE, letter-spacing: 0.05em |
| Button (link/text) | 14px | 400 | `#1358A0` | UPPERCASE, letter-spacing: 1.25px |
| Stat card number | 28px | 700 | `#181D1F` | Or `#1678C2` when active |
| Stat card label | 12px | 500 | `#6B7280` | — |

---

## Color Palette — Validated

### Primary
| Token | Hex | Usage |
|---|---|---|
| Primary Blue | `#1678C2` | Action buttons (solid), links, active states |
| Primary Blue Dark | `#1358A0` | Link-style button text color (enabled state) |
| Primary Blue BG | `#E1F5FF` | Selected state backgrounds, active card bg |
| Selected Blue | `#19AAFA` | Filter chip borders |
| Primary Green | `#27B872` | Page titles (legacy Jolt), success, "Saved" flash |

### Text
| Token | Hex | Usage |
|---|---|---|
| Strong text | `#181D1F` | Primary cell content, headings |
| Body text | `#555555` | General content, drawer title |
| Structural text | `#3D4144` | Table headers (lighter than strong) |
| Muted text | `#6B7280` | Secondary labels, placeholders |
| Light text | `#9BA0B0` | Placeholder hints, disabled |

### Structural
| Token | Hex | Usage |
|---|---|---|
| Page background | `#fff` | All content pages |
| Shell background | `#F7F7FA` | SmartSense ONE shell wrapper |
| Table header bg | `#F9F9F9` | AG Grid header row (validated live) |
| Table header bg (alt) | `color-mix(in srgb, #fff, #181d1f 2%)` | AG Grid CSS variable — same visual result |
| Input background | `#F3F3F3` | Jolt search pill background (some pages) |
| Card/row hover | `#F9FAFB` | Table row hover, list item hover |
| Border (interactive) | `#BABABA` | Buttons, inputs, cards — use for interactive elements |
| Border (structural) | `#DBDBDB` | Table row dividers, section dividers |
| Border (light) | `#F3F3F4` | Between list items inside panels |

### Semantic
| Token | Hex | Usage |
|---|---|---|
| Danger / Error | `#E53935` | Destructive actions, error states, need-attention dot |
| Danger BG | `#FEF2F2` | Error/danger card background |
| Danger Border | `#FECACA` | Error/danger card border |
| Amber | `#F59E0B` | Warning card border |
| Amber BG | `#FFFBEB` | Warning card background |
| Amber Text | `#92400E` | Warning card text |
| Success | `#27B872` | Success states (same as primary green) |

---

## Border Radius
**Standard:** `4px` — used on buttons, inputs, cards, table container, drawer dropdowns
**Pill:** `12–16px` — used on filter chips, tag pills
**Full pill:** `28px` — used on the Jolt chip/tag form component (multi-select inputs)

> **Note:** The original design system doc said 6px. Live app consistently uses 4px on interactive components. Use 4px.

---

## Button Components

### Solid Button (Primary Action)
```
background: #1678C2
color: #fff
border: none
border-radius: 4px
padding: 8px 24px
font-size: 13–14px
font-weight: 500 (or 400 for drawer actions)
text-transform: uppercase
letter-spacing: 0.05em
```
Hover: slightly darker blue via ripple effect
Disabled: `background: #EAEAEA`, `color: rgba(0,0,0,0.38)`

### Outline Button (Secondary Action)
```
background: #fff
color: #1678C2
border: 1px solid #1678C2
border-radius: 4px
padding: 8px 16px
font-size: 13–14px
font-weight: 400–500
text-transform: uppercase
```
Hover: `background: #F3F3F4`

### Link Button (Tertiary / Inline Action)
Validated from live `type-link color-blue` class:
```
background: none
color: #1358A0
border: none
border-radius: 4px
padding: 4px 12px
height: 36px
font-size: 14px
font-weight: 400
text-transform: uppercase
letter-spacing: 1.25px
```
Hover: `background: #E1F5FF` (borderless light blue fill)
Active: `background: #B4E5FE`
Disabled: `color: rgba(0,0,0,0.38)`

> Use this style for secondary text actions inside panels (e.g. "CLEAR" in a filter value header).

### When to use border vs no border on secondary buttons
- **Border** (`outline` style): when the secondary button sits *alongside* a primary action and visual hierarchy needs to be clear
- **No border** (`link` style): when the action is standalone or contextual (inside a list, next to a field label)

---

## Input / Search Components

### Standard Text Input
```
border: 1px solid #BABABA
border-radius: 4px
padding: 8px 12px 8px 34px  (with left icon)
font-size: 13–14px
color: #181D1F
background: #fff
outline: none
```
Focus: `border-color: #1678C2`
Icon color at rest: `#6B7280` → `#1678C2` on focus

### Search Input Pattern (full-width, above table)
- Icon on left inside input, `left: 12px`
- Placeholder text inline (not floating label)
- Clear (×) button appears on right when value is present
- Full table width, standard border, `border-radius: 4px`
- Blue border on focus

### Jolt Search Pill (alternative, some pages)
Some Jolt pages use a pill-shaped search with grey background:
```
background: #F3F3F3
border: 1px solid #B7B7B7
border-radius: 3px
padding: 12px 16px 14px 45px
font-size: 16–18px
height: 52–56px
```
The floating label sits at `left: 45px, top: 16px`, `font-size: 16px`, `color: #555555`.
> For SmartSense ONE pages, the standard text input pattern is preferred over the pill.

---

## Drawer Component

### Structure
```
position: fixed
top: 0, right: 0
width: 600px  (standard)
height: 100vh
background: #fff
border-left: 1px solid #DBDBDB
box-shadow: -4px 0 24px rgba(0,0,0,0.08)
z-index: 50
transform: translateX(0) | translateX(100%)
transition: transform 0.22s cubic-bezier(0.4,0,0.2,1)
```
Overlay behind drawer: `rgba(0,0,0,0.18)`, closes drawer on click.

### Header (validated from `.instance-drawer-header`)
```
height: 72px  (or ~85px for more complex headers)
padding: 0 20–24px
border-bottom: 1px solid #DBDBDB
display: flex
align-items: center
gap: 12px
```
**Layout order:** Close button → Title → (spacer flex:1) → Action buttons

**Close button:** Uses `list-close` from listcons font (24px, `#1C1C1C`). In React without listcons, use Material-style SVG close icon at 20px.

**Title:** `font-size: 20px, font-weight: 700, color: #555555, letter-spacing: 0.25px`

**Action buttons:** Right-aligned in header. Primary = solid blue. Secondary = outline blue. Both `font-weight: 400, font-size: 14px` (not bold, not uppercase in drawer context — differs from page buttons).

> **No footer.** Jolt drawers put actions in the header. Remove footers.

---

## AG Grid (DataGrid)

### Validated CSS Variables
```css
--ag-border-color: #DBDBDB
--ag-header-background-color: color-mix(in srgb, #fff, #181d1f 2%)
--ag-header-column-separator-display: block
--ag-foreground-color: #181d1f
--ag-header-foreground-color: #1C1C1C
--ag-odd-row-background-color: #ffffff
--ag-font-size: 13px
```
In practice, set header background to `#F9F9F9` for cleaner rendering.

### Row/Cell Specs
| Property | Value |
|---|---|
| Row height | 42px |
| Header height | 42–48px |
| Cell font size | 14px |
| Cell font color | `#181D1F` (primary), `#555555` (secondary) |
| Cell padding | 0px (AG Grid manages internally) |
| Header font size | 13px |
| Header font weight | 700 |
| Header font color | `#3D4144` |
| Row border | `1px solid #DBDBDB` |
| Column separator | `1px solid #DBDBDB` (header and body) |
| Row hover | `#F9FAFB` |

### Column with icon (open/action)
- Width: 40px
- Content: centered `OpenInNew` icon at 19px
- Header: same icon at 19px, `color: #3D4144`
- No hover background on icon cell (avoids conflict with row hover)

---

## Chip / Tag Component

### Filter Chip (dismissible, inline with filters)
```
background: #E1F5FF
border: 1px solid #19AAFA
border-radius: 12px
padding: 3px 10px
font-size: 12px
color: #1678C2
```
Dismiss button: `×` icon, `color: #1678C2`

> Use for active filter indicators — this is a custom pattern, not the Jolt DS chip component.

### Jolt Chip Component (form input, multi-select)
```
background: #1678C2  (solid blue fill)
border-radius: 28px  (full pill)
height: 30px
font-size: 16px
color: #fff
padding: 8px 32px 8px 12px
```
Delete button uses `list-close` from listcons font, color `#E1F5FF`.

> Use for multi-select field values inside form components (drawers, edit forms). Do NOT use for filter chips — too visually heavy.

---

## Stat Card Pattern

```
background: #fff  (default) | #E1F5FF (active/blue) | #FFFBEB (amber)
border: 1px solid #BABABA  (default) | #1678C2 (active) | #F59E0B (amber)
border-radius: 4px
padding: 12px 18px
min-width: 140px
```
Number: `font-size: 28px, font-weight: 700`
Label: `font-size: 12px, font-weight: 500, color: #6B7280`

**Clickable stat cards:** Add hover state (`background: #F5FAFE`), active state (blue border + blue background + blue text), cursor: pointer. Example: "Need Attention" card that toggles a filter.

**0/empty state:** Reduce `opacity` to 0.5 when showing a zero value that will populate after user action.

---

## Icon Fonts

### listcons
Jolt's custom icon font, loaded from:
`https://cdn.joltup.com/apps/list-files/fonts/listcons/style.css`

Key classes used in the app:
| Class | Usage |
|---|---|
| `list-close` | Drawer close button, chip delete |
| `list-open-in-new` | Row open/launch icon (col 0 in grids) |

> These are not available outside the Jolt app domain. In prototypes, substitute with equivalent Material Design SVG paths.

**Material SVG equivalents:**
- Close: `<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>`
- OpenInNew: `<path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>`
- Vertical kebab: Three circles at cx=12, cy=5/12/19, r=1.5

---

## Navigation Shell (SmartSense ONE)

### Top Bar
```
height: 52px
background: #fff
border-bottom: 1px solid #CCCDD0
padding: 0 16px
display: flex
align-items: center
gap: 12px
```
Contents (left to right): Hamburger button → Logo (28px) → App name (`SmartSense ONE`, 14px/600/`#35353B`) → `1px solid #CCCDD0` vertical separator → Page name (14px/400/`#35353B`)

### Floating Nav Drawer
```
position: fixed
top: 53px, left: 0
width: 224px
background: #fff
border: 1px solid #CCCDD0
border-radius: 4px
box-shadow: 0 9px 28px 8px rgba(0,0,0,0.05),
            0 6px 16px 0px rgba(0,0,0,0.08),
            0 3px 6px -4px rgba(0,0,0,0.12)
```
Active nav item: `background: #5CA6D9, color: #fff, font-weight: 600`
Hover: `background: #F7F7FA`

---

## Custom Select (Dropdown) Pattern
When native `<select>` is unacceptable (cross-platform rendering differs significantly):

```
Trigger:
  border: 1px solid #BABABA → #1678C2 on open
  border-radius: 4px
  background: #fff
  padding: 8px 32px 8px 12px
  font-size: 14px
  color: #555555
  height: 38px min
  Chevron: right: 10px, rotates 180° when open

Dropdown panel:
  background: #fff
  border: 1px solid #BABABA
  border-radius: 4px
  box-shadow: 0 4px 12px rgba(0,0,0,0.1)
  max-height: 220px, overflow-y: auto

Option row:
  padding: 8px 12px
  font-size: 14px
  color: #555555
  hover: background #F9FAFB
  selected: background #E1F5FF, color #1678C2, checkmark icon
```

---

## Key Conventions — Gotchas and Rules

1. **`Open Sans` always** — Storybook uses Nunito Sans in its shell. Ignore it. The live app is Open Sans throughout.

2. **Border radius is 4px, not 6px** — The original DS doc said 6px. Live app uses 4px consistently on all interactive components.

3. **Border color for interactive elements is `#BABABA`, not `#DBDBDB`** — `#DBDBDB` is for structural dividers (table rows, section separators). Buttons, inputs, and cards use `#BABABA`.

4. **Drawer actions go in the header, not a footer** — Jolt's drawer pattern puts Save/Apply/Cancel in the header right side. No footer.

5. **Button font weight in drawers is 400** — Page-level buttons use weight 500. Drawer header action buttons use weight 400. Don't bold them.

6. **Uppercase buttons on pages, case varies in drawers** — Page toolbar buttons: UPPERCASE. Drawer header action buttons: UPPERCASE is fine. Link-style buttons: always UPPERCASE with 1.25px letter spacing.

7. **Green (`#27B872`) is a legacy Jolt page title color** — SmartSense ONE shell uses `#35353B` for the page name. Don't use green for titles in new SmartSense ONE pages.

8. **The Jolt chip component is for form inputs, not filter indicators** — Solid blue `#1678C2` fill pill is a form multi-select component. Use the lighter outlined chip pattern for dismissible filter chips.

9. **AG Grid column separators extend through the header** — Set `border-right` on header cells. Body cells also get `border-right` for visual alignment.

10. **`#F9F9F9` for AG Grid header background** — The CSS variable resolves to a near-white that's visually equivalent. Use the hex directly in prototypes for predictability.

---

## Storybook Component IDs (for reference)
Base URL: `https://cdn.joltup.com/apps/lists-web-docs/index.html?path=/story/[id]`

| Component | ID |
|---|---|
| Button variants | `button--all-examples` |
| Type scale | `textstyles--example` |
| Checkbox | `form--checkbox-playground` |
| Radio | `form--radio` |
| Select | `form--select` |
| Multi-select | `form--multi-select` |
| Search bar | `searchbar--example` |
| Filter bar | `filterbar` |
| Chip | `chip--chip` |
| Drawer | `drawer--drawer-example` |
| AG Grid | `datagrid` |
| Tabs | `tabs` |
| Stats card | `statscard` |
| Snackbar | `snackbar` |
| Alert | `alert` |
| Empty state | `emptystate` |

---

## Universal App (UA) — Mobile Color Tokens

*Source: ~/Projects/universal repo, validated May 2026*
*The UA is the production React Native mobile app. It has its own 
color scale that does not map 1:1 to @joltup/colors. Use these 
values when building mobile prototypes that simulate the UA chrome.*

### When to use UA tokens vs @joltup/colors
- **UA tokens:** mobile prototype chrome (status bar, app header, 
  list header, info bar, logout pill) — anything simulating the 
  iOS/Android app
- **@joltup/colors:** web prototype components (dashboards, admin 
  pages, desktop UI)

### UA color scale

| UA Token | Hex | Notes |
|---|---|---|
| `white1` | `#FFFFFF` | Backgrounds, icon fill |
| `gray200` | `#EAEAEA` | Pill borders, light borders |
| `gray600` | `#6F6F6F` | Muted text, sublist header bg |
| `gray800` | `#3D3D3D` | Hamburger icon color (closed state) |
| `gray900` | `#1C1C1C` | Hamburger bg (open, tablet only) |
| `blue500` | `#0078C8` | List header bg, primary interactive blue |
| `red400` | `#E93631` | Past-due list header bg |

### UA component dimensions

| Component | Property | Value | Source file |
|---|---|---|---|
| App header (InfoBar) | height | 50px | topInfoBarHeight constant |
| Hamburger icon | size | 35px (icon.xlg) | SideMenuToggleButton.js |
| Hamburger container | width × height | 78 × 50px | styles.iconWrap |
| Avatar (UserAvatar) | diameter | 40px | LoginButton.tsx |
| Logout pill | minHeight | 40px | LogoutButton.styles.ts |
| Logout pill | borderRadius | 100 (full pill) | LogoutButton.styles.ts |
| Logout pill | borderColor | gray200 (#EAEAEA) | LogoutButton.styles.ts |
| "Log out" text | fontSize / weight | 14px / 600 | text.subtitle2 |
| Timer text | fontSize / weight | 14px / 600 | text.subtitle2 |
| List header bar | minHeight | 45px | ListHeader.style.ts |
| List header bg | color | blue500 (#0078C8) | ListHeader.style.ts |
| Chevron (location) | size | 20px | SyncStatus.tsx |

### UA icon size scale

| Token | Value |
|---|---|
| `icon.mini` | 15px |
| `icon.sm` | 20px |
| `icon.med` | 25px |
| `icon.lg` | 30px |
| `icon.xlg` | 35px |

### UA spacing scale

| Token | Value |
|---|---|
| `margin.mini` / `padding.mini` | 3px |
| `margin.sm` / `padding.sm` | 5px |
| `margin.med` / `padding.med` | 8px |
| `margin.lg` / `padding.lg` | 10px |
| `margin.xlg` / `padding.xlg` | 15px |
| `margin.xxlg` / `padding.xxlg` | 20px |

### UA typography scale

| Token | Size | Weight | Line height | Letter spacing |
|---|---|---|---|---|
| `text.subtitle2` | 14px | 600 | 20 | 0.1 |
| `text.caption` | 12px | 400 | 16 | 0.4 |

---

## Appendix: Hex-to-Token Mapping

*Cross-reference between the validated hex values in this doc and their `@joltup/colors` / `LIST_COMPONENT_COLORS` equivalents. Use these when writing Emotion styled components.*

### `@joltup/colors` direct mappings

| Hex in this doc | `@joltup/colors` token | Notes |
|---|---|---|
| `#1678C2` | `colors.blue[800]` / `colors.primaryTheme.blue` | Primary blue |
| `#1358A0` | `colors.blue[900]` / `colors.primaryTheme.blueDark` | Primary blue dark |
| `#E1F5FF` | `colors.blue[50]` / `colors.primaryTheme.blueLight` | Primary blue background |
| `#19AAFA` | `colors.blue[500]` | Selected/filter blue |
| `#2FB7FC` | `colors.blue[400]` | — |
| `#B4E5FE` | `colors.blue[100]` | Link button active bg |
| `#27B872` | `colors.green[400]` / `colors.primaryTheme.green` | Primary green |
| `#F9F9F9` | `colors.grey[50]` | Table header bg, subtle fill |
| `#F3F3F3` | `colors.grey[100]` | Input bg (search pill) |
| `#EAEAEA` | `colors.grey[200]` | Disabled button bg |
| `#DBDBDB` | `colors.grey[300]` | Structural borders, drawer borders |
| `#B7B7B7` | `colors.grey[400]` | Border (Jolt search pill) |
| `#979797` | `colors.grey[500]` | — |
| `#6F6F6F` | `colors.grey[600]` | — |
| `#1C1C1C` | `colors.grey[900]` | Close button icon color |
| `#ffffff` | `colors.white.white` | — |
| `#000000` | `colors.black.black` | — |
| `rgba(0,0,0,0.87)` | `colors.black.highEmphasis` | — |
| `rgba(0,0,0,0.38)` | `colors.black.disabled` | Disabled text |
| `#EB4C46` | `colors.red[400]` | — |
| `#C21D1D` | `colors.red[800]` / `colors.primaryTheme.red` | — |

> **Partial matches:** Some hex values in this doc (`#35353B`, `#555555`, `#3D4144`, `#6B7280`, `#181D1F`, `#9BA0B0`, `#BABABA`, `#5CA6D9`, `#CCCDD0`) are **not in `@joltup/colors`**. They were scraped from the live SmartSense ONE shell, which applies additional styling on top of the Jolt DS. Use raw hex for these.

### `LIST_COMPONENT_COLORS` (THEME_LIGHT) mappings

These are the semantic tokens to use in Pattern 2 (interactive components). All values are THEME_LIGHT defaults.

| Hex in this doc | `LIST_COMPONENT_COLORS` token | Resolved value |
|---|---|---|
| `#E1F5FF` | `PRIMARY.LIGHTER` | `colors.blue[50]` |
| `#B4E5FE` | `PRIMARY.LIGHT` | `colors.blue[100]` |
| `#2FB7FC` | `PRIMARY.MAIN` | `colors.blue[400]` |
| `#1678C2` | `PRIMARY.DARK` | `colors.blue[800]` |
| `#1358A0` | `PRIMARY.DARKER` | `colors.blue[900]` |
| `#ffffff` | `PRIMARY.DARK_CONTRAST_TEXT` | `colors.white.white` |
| `#EAEAEA` | `BACKGROUND.PRIMARY` | `colors.grey[200]` |
| `#ffffff` | `BACKGROUND.SECONDARY` | `colors.white.white` |
| `rgba(0,0,0,0.87)` | `BACKGROUND.CONTRAST_TEXT` | `colors.black.highEmphasis` |
| `#F9F9F9` | `BACKGROUND.TRASNPARENT_HOVER` | `colors.grey[50]` |
| `#EAEAEA` | `BACKGROUND.TRASNPARENT_ACTIVE` | `colors.grey[200]` |
| `#F3F3F3` | `BORDER.LIGHTEST` | `colors.grey[100]` |
| `#EAEAEA` | `BORDER.LIGHTER` | `colors.grey[200]` |
| `#DBDBDB` | `BORDER.LIGHT` | `colors.grey[300]` |
| `#B7B7B7` | `BORDER.MAIN` | `colors.grey[400]` |
| `#979797` | `BORDER.DARK` | `colors.grey[500]` |
| `rgba(0,0,0,0.6)` | `BORDER.DARKER` | `colors.black.mediumEmphasis` |
| `rgba(0,0,0,0.38)` | `DISABLED.MAIN` | `colors.black.disabled` |
| `#B7B7B7` | `DISABLED.CONTRAST_TEXT` | `colors.grey[400]` |
| `#F9F9F9` | `DISABLED.LIGHTER` | `colors.grey[50]` |
| `#EB4C46` | `ERROR.MAIN` | `colors.red[400]` |
| `#C21D1D` | `ERROR.DARK` | `colors.red[800]` |

---

*Document maintained by: prototyping sessions with Claude*
*Updated: May 2026 — Emotion conventions and token mapping added after GitLab source validation*
