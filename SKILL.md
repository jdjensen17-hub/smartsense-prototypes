---
name: smartsense-design
description: Use this skill whenever generating, editing, prototyping, or mocking ANY interface, component, screen, asset, or visual artifact for SmartSense by Digi — production code or throwaway prototypes alike. Provides the inviolable design tokens, semantic color rules, brand voice, Proxima Nova fonts, logos, severity icons, and a reference UI kit modeled on the ssbd-cloud app. Trigger on any mention of SmartSense, ssbd-cloud, asset monitoring, voyage tracking, gateways, incidents, alarms feed, digital logbook, or related product modules — even if the user does not say "SmartSense" explicitly but is clearly working on something inside this product.
license: Proprietary — SmartSense by Digi
---

# SmartSense Design Skill

A portable, **tool-agnostic** design context for SmartSense by Digi. Works in Claude
(Skills / Projects / Code), Cursor, Windsurf, v0, Lovable, Figma Make, or plain LLM
chat. Stack-agnostic — HTML, React, Vue, Svelte, or anything else.

> The `.md` files in `docs/design/` are **not optional reading** — they are the
> _semantic layer_. `docs/design/colors_and_type.css` gives the token _values_;
> the `.md` files explain what the tokens _mean_ and which uses are forbidden.
> Generating UI from the CSS alone produces on-palette but off-brand output.
> **Read the docs first.**

## Confirmation handshake (do this first)

When you load this skill, your first reply in the session must include the
literal line:

> Context loaded. Read AGENTS.md + docs/design/meta.md + docs/design/colors.md + docs/design/usage-rules.md. Ready for task.

This proves you read the operating contract instead of working from assumptions.

## Reading order (progressive disclosure — read top-down, stop when you have enough)

1. **`AGENTS.md`** (at the skill root) — the operating contract: inviolable rules, component guardrails, voice. _Always._
2. **`docs/design/meta.md`** — system identity, hard constraints, semantic-color rule, known gaps. _Always._
3. **`docs/design/colors.md`** — color tokens + when each is allowed. _Always before using color._
4. **`docs/design/usage-rules.md`** — DO / DO NOT list + anti-patterns. _Always before generating._
5. **`docs/design/components.md`** — per-component anatomy, states, tokens. _Before building a component._
6. **`docs/design/colors_and_type.css`** — verify the exact `--ss-*` token name before you type it.

Load on demand:
- `docs/design/typography.md` — type scale + font rules
- `docs/design/dimension.md` — spacing, radius, layout
- `docs/design/shadow.md` — elevation system + focus rings
- `docs/design/motion.md` — duration + easing tokens

When unsure about a component's visual spec, refer to `docs/design/components.md` for the full anatomy, states, and token mapping.

## Inviolable rules (full text in `AGENTS.md` §3)

- **Link `docs/design/colors_and_type.css`** from every HTML artifact; import it
  at the app root for React.
- **Tokens only — never raw hex/`rgb()`/`rgba()`.** Every value has a `--ss-*`
  token. The only allowed literals are the two documented on-white overrides
  (`#6b1717`, `#6b3600`). If a needed token is missing, **add it to
  `colors_and_type.css` (fix in spec) and flag it** — do not inline a literal.
- **Semantic colors are status signals, never decoration.** `--ss-danger` /
  `--ss-warning` / `--ss-success` / `--ss-info` mean alarm / degraded / healthy
  / informational only.
- **Proxima Nova only** via `var(--ss-font-sans)`. Never Roboto (Figma-bug
  artifact). TTFs live in `docs/design/fonts/`.
- **Icons: custom SVG files** in `docs/design/assets/icons/`, exported from Figma.
  Use `<Icon name="..." size={16} />`. To add an icon, drop the `.svg` file in
  that folder — no code changes needed. No external libraries, no emoji.
- **Badges use `--ss-rd-4` (4px)** — not pill. Pills are reserved for status
  dots and avatars only.
- **Card shadows are static** — never change on hover. **Modal overlay is a
  solid scrim** — never `backdrop-filter: blur()`.
- **Fix problems in the spec (`.md` / CSS), not in generated output.** Flag the
  fix instead of patching the artifact.

## Voice varies by module (`AGENTS.md` §3.7)

| Module | Voice | Pattern |
|---|---|---|
| **Asset Monitoring** | Instrument — numeric, real-time | "46°F · 3h 12m", "4 of 23 offline" |
| **Checklists / Operate** | Foreman — imperative, time-bound | "Restock cooler 3", "Sign off receiving log" |
| **Food Safety / Guard** | Compliance — pass/fail, rule-based | "Receiving temp · Fail (min 140°F)" |

Universal: sentence case, units always, no emoji, no exclamation points.

## What's in this package

- `AGENTS.md` — operating contract (root). Read first.
- `docs/design/colors_and_type.css` — **source of truth** for every token + base type. Link it everywhere.
- `docs/design/meta.md` · `colors.md` · `typography.md` · `dimension.md` · `shadow.md` · `motion.md` · `components.md` · `usage-rules.md` — the semantic layer.
- `docs/design/fonts/` — Proxima Nova TTF family (Thin → Extrabold, regular + italic).
- `docs/design/assets/brand/` — logos (black/white) and isotypes.
- `docs/design/assets/icons/` — all UI icons (battery, severity, alerts, map, etc.).
- `docs/design/assets/illustrations/` — empty state illustrations.
- `docs/design/preview/` — one HTML specimen per component for visual reference.
- `docs/design/ui_kit/` — reference JSX components organized by atomic level:
  `atoms/` (Button, Badge, Input, Toggle, Icon), `molecules/` (KpiAndFilter),
  `organisms/` (TopNav, AssetTable, AlarmsFeed, SidebarTree, Modal), plus `App.jsx`.
- `docs/design/Showcase.html` — full design system reference: foundations, assets, and components with tokens and specs.

## How to work

1. **Confirm the handshake**, then read the docs in the order above.
2. **Link `docs/design/colors_and_type.css`** + copy needed `fonts/` and `assets/`.
3. **Reuse the kit.** For anything touching assets, alarms, sites, or
   operational tasks, start from `docs/design/ui_kits/smartsense/*.jsx`. They
   are small and copyable.
4. **Stay inside the system** using `var(--ss-*)` tokens (not the hex literals — those live only in the CSS).
5. For production handoff, share the relevant `.jsx` + tokens. For a quick
   mock, output an HTML artifact that links `colors_and_type.css` and reuses
   kit components.

## When invoked without specifics, ask

- Which module? (Asset Monitoring, Checklists, Food Safety, Audits, Maintenance, Labeling, Scheduling — or new)
- Audience? (site operator, regional manager, IT admin, exec / sales)
- Density target? (dense control-room vs. summarized exec dashboard)
- Surface? (product screen, marketing site, deck, email)
- Any specific knobs to tweak?

## Known gaps — flag, don't invent (see `docs/design/meta.md`)

Skeleton loaders (use spinner), date picker open state, multi-select / typeahead,
charts and data-viz components, dark mode. If asked for any of these, flag as
undefined and request specs rather than hallucinating values.
