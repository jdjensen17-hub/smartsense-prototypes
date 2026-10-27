# List Instance Status — Jolt mobile app design mock

Static, self-contained design mock. Served straight from `public/`, so it is not
wrapped in the React shell or the HashRouter.

- **Public URL:** `https://smartsense-prototypes.vercel.app/status-item-app-mock/`
- **Local:** `http://localhost:5173/status-item-app-mock/` (`npm run dev`)

## Files

| File | What it is |
|---|---|
| `index.html` | The mock. Screens S1–S11 plus the Design decisions section. No external assets — one file, inline CSS/SVG/JS. |
| `screens/` | PNG captures of each screen (S1–S11, `ref_*` reference shots, `00_overview_full_page.png`). Link these from a Jira epic when a static image is enough. |
| `build_mock.py` | Generator. `python3 build_mock.py` rewrites `index.html` in place. Python 3, no dependencies. |

Edit `build_mock.py`, not `index.html` — a regen overwrites hand edits.

Source: designed with Jim Jensen, Oct 26–27 2026. Referenced by epics LW-18142
and LW-18165. The HTML is the settled source of truth; the React prototypes under
`#/admin/statuses` cover the web side of the same feature.
