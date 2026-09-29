# SmartSense / Jolt information-library reference notes

Captured 2026-09-25 (box browser; screenshots are 1024px-wide browser captures).

## SmartSense ONE — `#/operate/lists`
- **Shell:** 42px white top bar with hamburger, circular SmartSense mark + “SmartSense ONE”, a thin divider, page title “List Completion”, and account avatar at far right. Main canvas is very light gray/white.
- **Navigation:** collapsed state is icon-only hamburger; expanded drawer is a floating overlay rather than a content reflow. Operate section exposes List Completion (selected), List Template Editor, List Preview, and PDF Search.
- **Title / controls:** no separate large H1; the shell title carries the page title. Filter row is compact: Template label + “All templates” select, Location label + “Discovery Lab 1” select, and right-aligned “Search lists” field.
- **List pattern:** bordered table/card runs nearly full width with a 4-column header: List name, Due, Progress, Assigned to. Approximate captured geometry: x=22..1001, header ~40px, rows ~34px. Five visible rows use thin dividers and compact 11–12px text.
- **Row treatments:** first column is darker/bolder; due status uses small colored dot (red overdue, amber upcoming, gray neutral); progress is a thin horizontal meter plus `n/total`; assignee can be plain “Unassigned” or avatar + name.
- **Actions:** due column visibly sorted ascending; search and two selects are the top toolbar; blue circular Add list FAB is ~38px at lower-right of the table/card.
- **Density / spacing:** tight desktop admin density, roughly 16–19px horizontal cell padding, ~8–10px vertical row padding; table border and light gray separators define rhythm.

## SmartSense ONE — `#/admin/people` (chrome only)
- **Top bar:** same ~42px shell; title is “People”.
- **Expanded drawer:** ~222px wide and ~289px tall in the captured chrome crop, overlaid from the left beneath the top bar. Admin is expanded with People selected in blue, then Roles, Location Tags, Org Hierarchy, License Assignment, Distribution; Operate is collapsed below. Typography is compact (~11–12px), with generous left inset for submenu items and thin vertical guide rule.
- **Scope note:** page-body colors/components were intentionally not used as design source; only the shell and drawer chrome were captured.

## Jolt Information library (session was still signed in)
- **Route:** `/content/information/indexAccordion` (the shorter `/content/information` route returned 404). Page title is “Information”.
- **Hierarchy:** top tabs are Content Group and Locations. Categories are accordion rows (observed: Corporate Best Practices, Corporate Procedures). An expanded category reveals a blue “+ New Subcategory” bar and subcategory accordions (Audits, Different File Types, Quick Start Guides). An expanded subcategory reveals a FILES section.
- **File actions:** FILES toolbar has Upload your Own File(s), Create A Custom File, Edit File Permissions, and Sort (A-Z). Category/subcategory rows show pencil/edit and red X/delete affordances; file rows show right-side view/file and edit/delete icons.
- **Observed files:** Audits contained “The Panera Way” and “Demonstration of Knowledge”, each with a timestamp. File permissions is the explicit viewer/access control affordance; the row also has a viewer/document icon.
- **Layout / density:** 42px-ish header, dark icon rail at left (~43px), compact 28–30px accordion bars, blue action bars, small gray 12–13px text, thin gray borders and tight vertical stacking.

## Screenshot paths
- `/workspace/smartsense-information/refs/lists-collapsed.png`
- `/workspace/smartsense-information/refs/lists-expanded.png`
- `/workspace/smartsense-information/refs/lists-operate-nav.png`
- `/workspace/smartsense-information/refs/people-chrome-topbar.png`
- `/workspace/smartsense-information/refs/people-chrome-drawer.png`
- `/workspace/smartsense-information/refs/jolt-info-collapsed.png`
- `/workspace/smartsense-information/refs/jolt-info-expanded.png`
