# WP-C1 browser verification

Verified on 11 November 2026 IST using Playwright against the isolated intended WP-C0/C1 validation snapshot at `http://127.0.0.1:5177/architech-plugins/`. The Windows shared worktree was not changed by this browser verification. This report covers the eight new tools and the frozen Manage Text regression check.

## Method and evidence

Each route was opened at **1440 × 1000** and **390 × 844**. The checks exercised normal motion, the light theme, result states, applicable cancellation and confirmation paths, document/body horizontal overflow, and reduced motion using `page.emulateMedia({ reducedMotion: 'reduce' })`. Full-page screenshots retain the requested viewport width. Screenshot files are local evidence, not published assets:

`C:\Users\arnav\agent-tools\wp-c1-shots\<slug>_<1440|390>_<open|guard|result|reduced>.png`

The final screenshot pass scrolled to the top and awaited all finite dialog animations before capture, so the sticky site header remains at the page top. Initial provisional screenshots were overwritten after the final shared-kit and integration fixes.

No browser page errors or console errors were observed during the core flows. Development mode produces two existing React Router v7 future-flag warnings, concerning `startTransition` and relative splat-path resolution. These warnings did not prevent navigation or tool actions.

The eight new demos reported **zero running dialog animations immediately after an action under reduced motion** at both widths. The task-based demos retained two visible before/after panels side by side. Reduced-motion verification of the frozen Manage Text exposed inherited legacy button-colour transitions; see the issue below and the integration addendum for its final disposition.

## Per-tool results

| Tool | Verified outcomes at both widths |
|---|---|
| Spot Elev Override | Empty pattern search disables OK. Dash plus Whole project previews 23 overrides in four views. No returns to scope without a result receipt. Yes reports 23 overrides and four views. Clear line pattern override reports the override cleared. Light theme switches correctly. |
| Split Region With Line | Unusable detail line reports the native no-usable-curve error. Closing dependent review applies nothing. Split all creates six pieces from three regions and reports one dependent deletion. Safe skip creates four pieces from two regions and skips the dependent region. |
| Split Floor Ceiling | Closing dependent review applies nothing. Allow listed deletions creates seven pieces from three hosts. Skip with dependents creates five pieces from two hosts. The Grouped refusal scenario excludes the first host and previews two eligible hosts. |
| Coord Plan | The placed-on-A-101 option displays the viewport-removal warning. Keep existing creates/deletes no view. Rebuild reports one existing plan replaced, three CAD categories and 38 annotation categories hidden, and removal of the old A-101 viewport. With no existing plan, Launch creates on Level 01 and reports no replaced existing plan. |
| Navis View | Keep existing creates/deletes no views. Normal rebuild hides links; Shift rebuild keeps them visible. Ctrl category batch creates six views. No returns to the picker without applying. Check all includes targets hidden by a search. Repeating the six categories skips all six existing names and changes nothing. Workset batch creates four views; closing Architecture offers only three worksets. A non-workshared sample displays the native workset requirement warning. |
| Links Inspector | Initial scan has seven rows. Unloaded Landscape isolation returns the native reload warning. CAD deletion prompt says only this placement is removed. No preserves all seven rows; Yes removes the CAD row, leaving six. Export produces six current rows. Keyboard selection/Enter row detail and visible 3 px focus were checked. |
| Pin / Unpin Links | Pin all targets three initially unpinned placements; Cancel preserves them. Confirm pins all seven placements and disables operations with nothing left to change. Refresh preserves the pin states. Unpin all targets seven; Pin RVT targets four; Pin CAD targets three. Final grid has seven pinned placements. Selecting one row does not narrow the bulk operation. Keyboard focus is visible at 3 px. |
| In-Place Inspector | Initial scan has nine families. Actions are disabled until a row is selected. The unused family reports no instances to show/select. Kitchen bulkhead selects 24 instances. Delete confirmation names all 24; Cancel leaves nine rows and confirmation leaves eight. Instances sorting switches to descending; Enter opens row detail. Keyboard focus is visible at 3 px. |
| Manage Text | Title Case plus Refresh gives three preview rows with two checked by default. Apply reports exactly two sample notes changed. These counts match the finished reference demo. Dark/light switching works and there is no horizontal page overflow. Its three implementation files were not edited. |

Document and body scroll widths stayed at or below each viewport. Wide native inspector tables scroll within their table region on mobile rather than expanding the page.

## Download readback

Browser downloads were saved locally and independently read with PowerShell:

- `links-inspector_1440_report.csv`: **six** data rows, with **zero** `Kitchen Detail.dwg` rows after deletion. The JSON receipt contains six current rows and `fictional: true`.
- `in-place-inspector_1440_report.csv`: **eight** data rows, with **zero** `Kitchen bulkhead` rows after deletion. The JSON receipt contains eight current family rows and `fictional: true`.

The native button label is **Export to Excel**. The browser simulation downloads CSV, and the receipt explicitly states that the native save dialog supports XLSX or CSV. The browser does not produce an XLSX workbook.

## Issue found and referred for the shared fix

Immediately after Manage Text Apply under reduced motion, the inherited `.ad-btn` rules in legacy `dialog.css` still produced 120 ms `background-color` and `border-color` CSS transitions. The text/model-fixture state changed immediately; no transform or before/after morph was involved. A captured readback showed nine running colour transitions. This was shared styling outside the frozen Manage Text implementation.

The root agent imported `kit/accessibility.css` through the WP-C0-owned shared UI, disabling animation and transitions for `.ad` descendants under reduced motion. After a fresh route load at both 1440 and 390 px, the same Title Case → Refresh → Apply sequence reported **zero running animations immediately after Apply**, while preserving the exact two-note receipt. This fixed the shared reduced-motion issue without changing any frozen Manage Text file.

The normal-motion Pin all check also exposed seven simultaneous animations: three inherited 120 ms button-opacity transitions, a direct 420 ms table animation and three SVG animations. The table was changed to use the shared `animateOnce` budget; the root agent disabled inherited transitions and player-toast animation within the new kit players. After rebuilding, live readback immediately after Pin showed **three running animations total**, lasting **420, 480 and 520 ms**, with only transform and opacity keyframes. There were no sub-300 ms animations in that action.

## Limits

These checks validate the browser simulations and exported fictional reports. They do not establish real Revit model-write behaviour, native transaction outcomes, Lighthouse scores, measured mobile 4G performance, or an exhaustive accessibility audit. Native read-only checks are documented separately in `native-verification.md`.

## Integration addendum

The final combined production build was tested at `http://127.0.0.1:5178/automation/`, served from `C:\Users\arnav\agent-tools\wp-c0-c1-integration`. This used the Windows command `$env:BASE='/automation/'; npm run build`; TypeScript and Vite completed successfully after the final motion fixes. The final code retains the other writer's coordinated additions, so this is a regression check of the combined result rather than a claim based only on the earlier isolated snapshot.

All **nine routes × two viewports** were opened again and completed their primary result flow. The final checks reconfirmed the eight new tools' expected counts and Manage Text's three preview rows, two default checks and two applied notes. There were **zero console errors, zero console warnings, zero page errors and zero document/body horizontal overflow** during the production checks. All eight new tools and Manage Text showed **zero running dialog animations immediately after a reduced-motion action**. Visible keyboard focus was checked on each new tool; the browser readback was a solid 3 px outline.

Final screenshots comprise **54 open/result/reduced files** plus **16 native-guard replicas**. Every filename identifies the tested 1440 or 390 px viewport. Full-page PNG content excludes the browser's 15 px scrollbar, yielding 1425 or 375 px image content; the actual Playwright viewports were 1440 × 1000 and 390 × 844. The final Links Inspector desktop result and Navis View mobile result were visually inspected to confirm the sticky header stays at the top and content is legible.

### Lazy discovery and route metadata

- Loading the demo gallery requested **zero** of the eight tool chunks.
- Clicking the observed gallery link to Spot Elev Override loaded **only** `spot-elevation-line-*.js` among the eight tool chunks. The guide displayed the tool's full source-specific steps: Choose a line pattern, Choose the scope, Confirm the override.
- A separate cold direct load of In-Place Inspector displayed its nine rows and all three source-specific guide steps, demonstrating that route metadata resolves before the player renders.
- The gallery/network and in-app navigation check was repeated after the final motion rebuild and passed again.

### Storefront-port smoke checks

The following extra checks were performed at desktop width against the final combined production preview. They are narrower than the two-width acceptance pass for the nine priority routes.

- **Excel workbook relinking:** switched to Incoming/P03, explicitly left only Door Schedule ticked, chose the existing ArchiTECH-managed Door Schedule, cancelled the review once, then confirmed it. The result retained **SCH-101**, **A-601 and A-602**, and **4 rows × 4 columns**. Last run details independently showed the previous Coordination/P02 workbook and new Incoming/P03 workbook. Choosing the Sticky target was refused and preserved the previous result. Choosing the named region set the source syntax to **`@Name:IssueRows`**.
- **Nested family parameters:** launching from the project sample displayed the open-family-document guard. Switching to **AT-01 Double Flush Door.rfa** and choosing Associate produced **two associations and one issue**. Inset and Label Text became associated, Panel Thickness retained its existing association, and Clearance remained unassociated because the host parameter's data type or binding differed.
- **Suite Home:** the Folio Home route worked independently of the frozen Home/page files. Searching PDF selected Sheet Export, Open tool produced its browser handoff, and Continue to Sheet Export was available. The No active model context disabled Open tool; restoring the sample context and changing the theme worked. No horizontal overflow was observed in this desktop smoke check.

Some exploratory test calls initially used incomplete selectors, including `Details` rather than `Details…`, an exact Suite Home theme label that also contains option text, and an unprefixed named-region expectation. These were corrected from the rendered UI/source and rerun successfully. They were test-selector mismatches, not counted as product failures or passing evidence before correction.
