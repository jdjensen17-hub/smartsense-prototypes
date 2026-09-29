# SmartSense ONE — Information Library (static HTML mocks)

Visual and interaction references for Cursor to implement `/#/information` inside the SS1 shell.

## Scope (locked)

- **Route:** `/#/information`
- **Author library only** — full parity with today’s Jolt Information Library **except** no Content Group / Locations split
- **IA:** flat tenant library — **Category → Subcategory → File**
- **Out of scope (next pass):** Connect to Microsoft admin
- These files are **static mocks**, not production React

## Design system (must)

- Follow [`STYLING-S1.md`](./STYLING-S1.md)
- Import [`colors_and_type.css`](./colors_and_type.css) relatively; use **only** `var(--ss-*)` tokens
- Icons: Lucide CDN, 24×24 (16 inline), `strokeWidth` 1.4 — no emoji
- Interactive color is `--ss-sky-blue` only
- Badges `--ss-rd-4` (not pill); card shadows static; modal scrim `rgba(0,0,0,0.40)` with **no blur**
- Shared chrome/layout: [`mock-shell.css`](./mock-shell.css)

## Shell (from captures + notes.md)

| Fact | Source |
|---|---|
| ~42px **white** top bar: hamburger, mark, “SmartSense ONE”, divider, page title, avatar | `refs/lists-*.png`, `refs/people-chrome-topbar.png` |
| Drawer is a **floating overlay** ~222px (not a push reflow) | `refs/people-chrome-drawer.png`, `refs/lists-expanded.png` |
| Lists density: compact filter row + bordered table ~34px rows + FAB lower-right | `refs/lists-collapsed.png` |
| Operate nav includes Information (active) under Operate | mock drawer |

**Do not copy from People Admin:** body surfaces, People-specific components, or page voice — **chrome structure only**.

> Note: `STYLING-S1.md` documents `--ss-bg-navbar` (near-black) for the top navbar. **Live SS1 Lists/People captures use a white top bar.** These mocks follow the captures for shell shape and use `--ss-bg-surface` for the top bar.

## Visual references

| Path | Use for |
|---|---|
| `OperateLists.example.tsx` + `refs/lists-*.png` | Page density, toolbar, table, FAB |
| `refs/people-chrome-*.png` | Top bar + drawer structure only |
| `refs/jolt-info-*.png` + `notes.md` | Capability parity |
| [`notes.md`](./notes.md) | Measured shell/geometry notes |

## Jolt parity checklist (keep)

Browse categories/subcategories/files; **New Category**; **New Subcategory**; **Upload your own file(s)**; **Create a custom file**; **Edit file permissions**; **Sort A–Z**; per-file View / Edit / Delete / Replace; drag reorder / move between subcategories; viewers for PDF (embedded), image modal, video player; Office → download fallback; URL/link entries; custom rich-text.

**Omit:** Content Group / Locations tabs.

## Pages

| File | Purpose |
|---|---|
| [`index.html`](./index.html) | Master index |
| [`information.html`](./information.html) | Primary browse (drawer open, Information active) |
| [`information-category.html`](./information-category.html) | Subcategory selected + overflow menu |
| [`information-upload.html`](./information-upload.html) | Upload modal (+ optional URL) |
| [`information-create-custom.html`](./information-create-custom.html) | Create custom rich-text |
| [`information-permissions.html`](./information-permissions.html) | Edit permissions |
| [`information-viewer-pdf.html`](./information-viewer-pdf.html) | PDF viewer |
| [`information-viewer-media.html`](./information-viewer-media.html) | Image / video viewer |
| [`information-empty.html`](./information-empty.html) | Empty library |

## UX pattern

Modern enterprise content library mapped 1:1 to Category → Subcategory → File:

- Left tree for Category/Subcategory
- Main pane: searchable file table (Lists density)
- FILES action strip: Upload, Create custom, Edit permissions, Sort A–Z, New subcategory
- Row actions: View, Edit, Delete (+ overflow: Replace, Permissions)
- Library-level search (S1 parity-plus vs legacy Jolt)
- FAB lower-right (Lists convention) for quick add/upload
- Sentence case copy

## Fonts

Proxima Nova is referenced via `@font-face` in `colors_and_type.css` (`./fonts/…`). **`fonts/` is missing** — system fallback stack applies until TTFs are dropped in.

## Screenshot drop zone

Screenshots are present under [`refs/`](./refs/). Keep filenames stable if replacing captures.

## Token gap

`--ss-danger-hover` is documented in STYLING-S1.md but **not defined** in the provided `colors_and_type.css`. Mocks reference `var(--ss-danger-hover)` for destructive button hover — add that token to the design CSS before shipping, or map it in implementation.
