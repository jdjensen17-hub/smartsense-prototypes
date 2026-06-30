# STYLING-SS1.md

**SmartSense ONE Design System — Styling Reference for Claude Code**

---

> **When to use this file.**
> Use this file for all pages under `src/pages/operate/`, `src/pages/assure/`,
> `src/pages/guard/`, and `src/pages/service/` — any new SmartSense ONE web page.
>
> For legacy Jolt pages under `src/pages/user-management/` or `src/pages/mobile/`,
> use `STYLING.md` instead. Never mix token systems in the same component.

---

## Confirmation handshake

When you load this file, your first reply must include:

> Context loaded. Read STYLING-S1.md + AGENTS.md. Ready for task.

This confirms you are not working from assumptions.

---

## Stack

```ts
import styled from '@emotion/styled';
// No @joltup/colors on SmartSense ONE pages.
// All values come from --ss-* CSS custom properties defined in
// src/design/colors_and_type.css (already imported at the app root).
```

`colors_and_type.css` is the **single source of truth** for every token value.
It must be imported at the app root — it is already present at
`src/design/colors_and_type.css`. Do not re-import it per component.

---

## Inviolable rules

These are not preferences. Output that violates any of these is wrong.

### 1. Tokens only — never raw hex

```ts
// ✅ correct
const Card = styled.div({
  label: 'card',
  backgroundColor: 'var(--ss-bg-surface)',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
});

// ❌ wrong
const Card = styled.div({
  backgroundColor: '#ffffff',
  border: '1px solid #CCCDD0',
});
```

The only allowed hex literals are two on-white contrast overrides
documented in `colors.md`: `#6b1717` (red on white) and `#6b3600` (amber on white).
Every other value must use a `var(--ss-*)` token. If a needed token does not
exist in `colors_and_type.css`, **stop and flag it** — do not inline a literal.

### 2. Semantic colors are status signals — never decoration

| Token | Allowed use only |
|---|---|
| `--ss-danger` | Active alarms, offline states, destructive actions |
| `--ss-warning` | Degraded states, threshold warnings |
| `--ss-success` | Healthy / online / OK states |
| `--ss-info` | Informational banners and badges |

Using `--ss-danger` for emphasis, `--ss-success` for a positive brand moment,
or `--ss-warning` for a highlight is always wrong.

### 3. Font family — Proxima Nova only

```ts
fontFamily: 'var(--ss-font-sans)',
```

Never use Roboto as an intentional choice. It appears in Figma only due to
a rendering bug. The fallback stack in `colors_and_type.css` includes it as
a last resort — that is not an invitation to use it.

### 4. Icons — Lucide, 24×24, strokeWidth 1.4

```tsx
import { CheckCircle } from 'lucide-react';
<CheckCircle size={24} strokeWidth={1.4} color="currentColor" />
// Inline: size={16}
```

If a Lucide icon does not closely match the SmartSense custom icon, flag it
explicitly. Do not use emoji as icon substitutes.

### 5. Badges use `--ss-rd-4` — not pill-shaped

```ts
// ✅ correct
borderRadius: 'var(--ss-rd-4)',   // 4px

// ❌ wrong
borderRadius: 'var(--ss-rd-pill)', // pill reserved for status dots and avatars only
```

### 6. Card shadows are static — never change on hover

```ts
boxShadow: 'var(--ss-shadow-2)',  // always static
// ❌ Do not change on hover. cursor: pointer is the only hover change on a card.
```

### Modal overlays are solid scrims — no blur

```ts
// ✅ correct — use the literal value, --ss-overlay-scrim was removed in v1.0.0
background: 'rgba(0, 0, 0, 0.40)',

// ❌ wrong
backdropFilter: 'blur(4px)',
```

### 8. Fix problems in the spec, not in generated code

If a token is missing or a value looks wrong, flag it and stop.
Do not patch output to make it look right.

---

## Emotion pattern for SmartSense ONE

All styled components use `var(--ss-*)` tokens as string values.
Always include a `label` matching the component name.

```ts
import styled from '@emotion/styled';

const PageHeader = styled.div({
  label: 'page-header',
  padding: 'var(--ss-space-4) var(--ss-space-6)',
  borderBottom: '1px solid var(--ss-border-default)',
  backgroundColor: 'var(--ss-bg-surface)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const PageTitle = styled.h1({
  label: 'page-title',
  fontSize: 'var(--ss-size-h1)',
  fontWeight: 700,
  color: 'var(--ss-fg-heading)',
  margin: 0,
});
```

### Interactive states

Hover, focus, and active states use the same token approach inside
Emotion's nested selector syntax:

```ts
const NavItem = styled.button({
  label: 'nav-item',
  backgroundColor: 'transparent',
  color: 'var(--ss-fg-secondary)',
  borderRadius: 'var(--ss-rd-4)',
  padding: '8px 12px',
  border: 'none',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'var(--ss-bg-app)',
  },
  '&:focus-visible': {
    outline: '2px solid var(--ss-sky-blue)',
    outlineOffset: '2px',
  },
  '&.active': {
    backgroundColor: 'var(--ss-sky-blue)',
    color: 'var(--ss-fg-on-dark)',
    fontWeight: 600,
  },
});
```

---

## Token quick reference

The full values live in `colors_and_type.css`. These are the tokens you
will reach for most often. Verify exact names against the CSS before using.

### Brand / interactive

| Token | Value | Use |
|---|---|---|
| `--ss-sky-blue` | `#5CA6D9` | **The only interactive action color.** Buttons, links, active states, focus rings, toggles. |
| `--ss-dark-blue` | `#004676` | Structural chrome, page headings, section banners, create/config sheet headers. |
| `--ss-medium-blue` | `#2C82BD` | Hover on primary buttons. |
| `--ss-light-blue` | `#ABCDE5` | Section/callout background tint. |
| `--ss-pale-blue` | `#EEF5FC` | Soft panel backgrounds, selected row tint. |
| `--ss-danger-hover` | `#C80321` | Hover state for destructive buttons only. Never use for decoration. |

### Surfaces

| Token | Use |
|---|---|
| `--ss-bg-surface` | White. Cards, panels, side sheets, table rows. |
| `--ss-bg-app` | `#F7F7FA`. Page background, toolbar fills, header backgrounds. |
| `--ss-bg-subtle` | `#E0E1E3`. Very light fill — hover backgrounds, section dividers. |
| `--ss-bg-navbar` | Near-black. Reserved for the top navbar. |

### Foreground / text

| Token | Use |
|---|---|
| `--ss-fg-primary` | Default body text, table cells, data values. |
| `--ss-fg-heading` | H1, H2, H3 headings — dark blue, not near-black. |
| `--ss-fg-secondary` | Supporting text, column headers, metadata. |
| `--ss-fg-tertiary` | Placeholders, disabled labels, icons at rest. |
| `--ss-fg-on-dark` | White. Text on sky blue, dark blue, or dark surfaces. |
| `--ss-fg-link` | Sky blue. Links — always bold weight. |

### Borders

| Token | Use |
|---|---|
| `--ss-border-default` | `#CCCDD0`. Default 1px border on cards, inputs, table rows. |
| `--ss-border-strong` | Hover / emphasis borders. |
| `--ss-border-focus` | `--ss-sky-blue`. Focus ring on inputs and buttons. |

### Semantic — status signals only

| Token | Meaning |
|---|---|
| `--ss-danger` | Alarm / critical / offline / destructive |
| `--ss-danger-bg` | Alarm row tint / error banner fill |
| `--ss-danger-dark` | High-contrast danger text on light backgrounds |
| `--ss-warning` | Degraded / threshold exceeded |
| `--ss-warning-bg` | Warning row tint |
| `--ss-success` | Healthy / online / OK |
| `--ss-success-bg` | Success row tint |

### Spacing

Base-4 grid. `--ss-space-2` (8px) is the workhorse at component level.

| Token | Value | Use |
|---|---|---|
| `--ss-space-1` | `4px` | Icon-to-label gap, tight inline |
| `--ss-space-2` | `8px` | Component internal padding, row gap — workhorse |
| `--ss-space-3` | `12px` | Form field padding, badge padding |
| `--ss-space-4` | `16px` | Default component padding, group separation within a card |
| `--ss-space-6` | `24px` | Card padding, section gap |
| `--ss-space-8` | `32px` | Section-to-section spacing |

Do not use spacing values outside this scale (no `5px`, `7px`, `15px`, `20px`).

### Border radius

`--ss-rd-4` (4px) is the default for almost everything.

| Token | Value | Use |
|---|---|---|
| `--ss-rd-4` | `4px` | **Default.** Buttons, inputs, cards, badges, modals. |
| `--ss-rd-8` | `8px` | Larger panels, callouts, popovers. |
| `--ss-rd-pill` | `9999px` | Status dot indicators and avatars only. Never badges. |

### Shadows

| Token | Use |
|---|---|
| `--ss-shadow-2` | Cards and panel surfaces — always static, never changes on hover. |
| `--ss-shadow-3` | Modals, dropdowns, toasts, side sheet overlays. |
| `--ss-shadow-fab` | FAB (floating action button) elevation. Use this, not `--ss-shadow-3`, on FABs. |
| `--ss-shadow-focus` | Keyboard focus rings on inputs and buttons. |

### Typography sizes and weights

| Token | Size | Use |
|---|---|---|
| `--ss-size-h1` | `24px` | Page-level headings |
| `--ss-size-h2` | `20px` | Section headings |
| `--ss-size-h3` | `18px` | Card headings, panel headers |
| `--ss-size-body` | `14px` | **Default.** Table cells, labels, form fields. |
| `--ss-size-body-sm` | `12px` | Timestamps, metadata, captions, badge labels |
| `--ss-size-button` | `14px` | All button labels |
| `--ss-size-special` | `10px` | Tiny labels — minimum text size |

Allowed font weights: `300` (H2 Light paired only), `400`, `600`, `700`.
Never use `100`, `200`, `500`, `800`, or `900`.

---

## Component reference — common patterns

Full specs in `components.md`. These are the most frequently needed.

### Primary button

```ts
const PrimaryButton = styled.button({
  label: 'button-primary',
  backgroundColor: 'var(--ss-sky-blue)',
  color: 'var(--ss-fg-on-dark)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-button)',
  fontWeight: 700,
  padding: '10px 16px',
  border: 'none',
  borderRadius: 'var(--ss-rd-4)',
  cursor: 'pointer',
  '&:hover': { backgroundColor: 'var(--ss-medium-blue)' },
  '&:disabled': {
    backgroundColor: 'var(--ss-grey-500)',
    cursor: 'not-allowed',
  },
});
```

### Destructive button

```ts
const DestructiveButton = styled.button({
  label: 'button-destructive',
  backgroundColor: 'var(--ss-danger)',
  color: 'var(--ss-fg-on-dark)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-button)',
  fontWeight: 700,
  padding: '10px 16px',
  border: 'none',
  borderRadius: 'var(--ss-rd-4)',
  cursor: 'pointer',
  '&:hover': { backgroundColor: 'var(--ss-danger-hover)' }, // dedicated token — not --ss-medium-blue
});
```

### Secondary button (outlined)

```ts
const SecondaryButton = styled.button({
  label: 'button-secondary',
  backgroundColor: 'var(--ss-bg-surface)',
  color: 'var(--ss-sky-blue)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-button)',
  fontWeight: 700,
  padding: '9px 16px',
  border: '1px solid var(--ss-sky-blue)',
  borderRadius: 'var(--ss-rd-4)',
  cursor: 'pointer',
  '&:hover': { backgroundColor: 'var(--ss-pale-blue)' },
});
```

### Neutral button (cancel / non-brand)

```ts
const NeutralButton = styled.button({
  label: 'button-neutral',
  backgroundColor: 'var(--ss-bg-surface)',
  color: 'var(--ss-fg-primary)',
  fontFamily: 'var(--ss-font-sans)',
  fontSize: 'var(--ss-size-button)',
  fontWeight: 700,
  padding: '9px 16px',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  cursor: 'pointer',
});
```

### Text input

```ts
const TextInput = styled.input({
  label: 'text-input',
  height: '38px',
  width: '100%',
  backgroundColor: 'var(--ss-bg-surface)',
  color: 'var(--ss-fg-primary)',
  fontSize: 'var(--ss-size-body)',
  fontFamily: 'var(--ss-font-sans)',
  padding: '0 14px',
  border: '1px solid var(--ss-border-default)',
  borderRadius: 'var(--ss-rd-4)',
  outline: 'none',
  '&::placeholder': { color: 'var(--ss-fg-tertiary)' },
  '&:focus': {
    borderColor: 'var(--ss-border-focus)',
    boxShadow: 'var(--ss-shadow-focus)',
  },
});
```

### Status badge

> **Note on removed tokens (v1.0.0):** Three tokens were removed from `colors_and_type.css`
> in the v1.0.0 release. Use the literals below directly — do not reference the old token names:
> - ~~`--ss-warning-dark`~~ → use `#9A5A00` (warning text on tinted backgrounds)
> - ~~`--ss-black-10`~~ → use `rgba(53,53,59,0.10)` (offline badge tint)
> - ~~`--ss-overlay-scrim`~~ → use `rgba(0,0,0,0.40)` (modal scrim)

```ts
// 4px radius — never pill. Text color must come from the same ramp as the bg.
const Badge = styled.span<{ tone: 'ok' | 'warning' | 'alarm' | 'info' | 'offline' }>(
  ({ tone }) => ({
    label: 'badge',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: 'var(--ss-size-body-sm)',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: 'var(--ss-rd-4)',  // NOT pill
    ...(tone === 'ok'      && { backgroundColor: 'var(--ss-success-30)',  color: 'var(--ss-success-dark)' }),
    ...(tone === 'warning' && { backgroundColor: 'var(--ss-warning-bg)',  color: '#9A5A00' }),         // --ss-warning-dark removed in v1.0.0
    ...(tone === 'alarm'   && { backgroundColor: 'var(--ss-danger-bg)',   color: 'var(--ss-danger-dark)' }),
    ...(tone === 'info'    && { backgroundColor: 'var(--ss-pale-blue)',   color: 'var(--ss-dark-blue)' }),
    ...(tone === 'offline' && { backgroundColor: 'rgba(53,53,59,0.10)',   color: 'var(--ss-fg-primary)' }), // --ss-black-10 removed in v1.0.0
  })
);
```

---

## Voice — Operate / Lists module

SmartSense has three distinct module voices. List Completion pages use:

**Foreman / imperative.** Time-bound, action-oriented.

```
✅ "Restock cooler 3"
✅ "Sign off receiving log"
✅ "3 of 40 items complete"
✅ "Submit items"

❌ "Please complete the following items"
❌ "Your list has been submitted successfully!"
❌ "items" without a count
```

Universal rules:
- Sentence case everywhere. No Title Case in UI copy.
- Numbers always include units when applicable.
- No emoji in product UI.
- No exclamation points.

---

## Page file location

SmartSense ONE web pages live at:

```
src/pages/operate/[PageName].tsx
src/pages/assure/[PageName].tsx
src/pages/guard/[PageName].tsx
src/pages/service/[PageName].tsx
```

Routes follow `/operate/[feature]`, e.g. `/operate/lists`.
These routes use the full desktop shell (not the mobile shell).
The `isMobilePage` check in `App.tsx` uses `startsWith('/mobile/')` —
SmartSense ONE pages are unaffected and will receive the correct shell automatically.

---

## Known gaps — flag, do not invent

If asked to implement any of the following, flag as undefined and ask for specs:

| Area | Status |
|---|---|
| Icon library | ~150+ custom icons not packaged. Use Lucide (24×24, strokeWidth 1.4). Flag divergences. |
| Skeleton loaders | Not defined. Use rotating SVG spinner only. |
| Date picker open state | Not defined. |
| Multi-select / typeahead | Not defined. |
| Dark mode | Not a defined variant. Do not generate. |
| Sublist item type (List Completion) | Deferred — do not implement. |
| Manager visibility override (List Completion) | Deferred — do not implement. |

---

## What this file does not cover

- AG Grid configuration — column definitions, cell renderers, grid options.
  Ask Jim for the Work Orders grid as a reference implementation.
- Partner API shape — use mock data until API docs are available.
- Routing changes — describe in the infrastructure prompt, not here.
- React Native / mobile — see `STYLING.md` and the Universal App repo.
