# Revit suite demo delivery and verification

Branch `feature/live-demos` starts at `c5021d2`. The committed demo tree at `d093587` is byte-equivalent to `f74581b`. It excludes the Suite Home and featured assets briefly added by concurrent commit `e48bd43`.

Local preview at [Automation demos](http://127.0.0.1:5190/architech-plugins/demos/). The branch was committed locally. The production site, deployment pin and release configuration were outside the work package.

## Checks

- Clean archive build at `d093587` with `npm ci` and `npm run build -- --manifest` passed. The served build and the clean archive produced the same entry and demo assets.
- All 58 product pages linked to a direct demo. The layout and theme matrix passed 348/348 cases at 1440, 390 and 320 px in Dark and Light, without console errors or horizontal page overflow.
- The same six combinations passed 348/348 representative workflow checks. Selected cases also covered cancellation, invalid inputs, unticked rows and rollback. The tests cover representative paths and guards. Full option-by-option native parity is a separate check.
- App-shell entry and static JS dependencies measured 108.3 KB gzip. The largest incremental tool payload measured 30.4 KB gzip for VP Manager, including the generated engine it requires. The demo route shell through the catalogue and player totals 142.9 KB gzip before the tool payload.
- The demo-specific animations are finite and honor reduced motion. The shared guide highlight now runs once.
- 98 fictional browser captures are under `C:/Users/arnav/agent-tools/wp-c1-shots/browser`. Every tool has a desktop Dark capture. The eight code-built tools have six captures each.

[Browser evidence index](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/verification-index.json>)

## Native review

The MCP connector returned the complete visible Revit 2024 ribbon inventory. Duplicate entries, Suite Home, the theme control and the Point Cloud menu and visibility utility were excluded from the 19 / 16 / 23 product counts.

Seven opening states were confirmed from native windows or local captures. For the MCP-posted windows, the opening was verified on screen before closing. The checks used no Apply, export or save. Native captures can show model metadata and stay in the local evidence folder.

The other 51 tools still need an independent opening-state comparison in Revit. Their rows are marked Partial despite passing browser tests. Some code-built commands start with a Revit picker or can create a view on launch in certain contexts. Those paths need a disposable model and a verified safe stopping point. Browser input and results use fictional metadata and do not run the desktop commands.

## Per-tool coverage

Done means the representative browser workflow passed and the native opening state was observed. Partial means the browser workflow passed and native opening-state review is outstanding. Manage Text was tested without changing its dedicated implementation.

### Arch Folio · 19

| Tool | Status | Revit-checked | Screenshot |
| --- | --- | --- | --- |
| Auto Dimension | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/auto-dimension-1440-dark.png>) |
| Detail View | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/detail-view-1440-dark.png>) |
| Excel to Schedule | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/excel-to-schedule-1440-dark.png>) |
| Graphic Overviews | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/graphic-overviews-1440-dark.png>) |
| Make Pattern | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/make-pattern-1440-dark.png>) |
| Manage Dimension | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/manage-dimension-1440-dark.png>) |
| Manage Text | Done · preserved | Yes · four jobs and default scope | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/manage-text-1440-dark.png>) |
| Reorder Pro | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/reorder-pro-1440-dark.png>) |
| Room to View | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/room-to-view-1440-dark.png>) |
| Sheet Export | Done · reviewed path | Yes · Selection and export steps | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/sheet-export-1440-dark.png>) |
| Sheet Manager | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/sheet-manager-1440-dark.png>) |
| Spell Check | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/spell-check-1440-dark.png>) |
| Split Region with Line | Partial · native review pending | No | [Desktop Dark · C1](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/split-region-with-line-1440-dark.png>) |
| Spot Elevation Line | Partial · native review pending | No | [Desktop Dark · C1](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/spot-elevation-line-1440-dark.png>) |
| Template Manager | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/template-manager-1440-dark.png>) |
| Text/Tag Align | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/text-tag-align-1440-dark.png>) |
| Update Schedule | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/update-schedule-1440-dark.png>) |
| VP Manager | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/vp-manager-1440-dark.png>) |
| View Manager | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/view-manager-1440-dark.png>) |

### Arch Forge · 16

| Tool | Status | Revit-checked | Screenshot |
| --- | --- | --- | --- |
| Assign Room Properties | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/assign-room-properties-1440-dark.png>) |
| Copy Param from Link | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/copy-param-from-link-1440-dark.png>) |
| Deviation Inspector | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/deviation-inspector-1440-dark.png>) |
| FR to Finishes | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/fr-to-finishes-1440-dark.png>) |
| Family Param Transfer | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/family-param-transfer-1440-dark.png>) |
| Match Opening | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/match-opening-1440-dark.png>) |
| One Parameter | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/one-parameter-1440-dark.png>) |
| Parameter Manager | Done · reviewed path | Yes · tabs, default visibility and columns | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/parameter-manager-1440-dark.png>) |
| Parameter Mapping | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/parameter-mapping-1440-dark.png>) |
| Point Cloud Slicer | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/point-cloud-slicer-1440-dark.png>) |
| Replace Materials | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/replace-materials-1440-dark.png>) |
| Room Height Adjust | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/room-height-adjust-1440-dark.png>) |
| Room Level Assigner | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/room-level-assigner-1440-dark.png>) |
| Room to Finishes | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/room-to-finishes-1440-dark.png>) |
| Shared Param Manager | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/shared-param-manager-1440-dark.png>) |
| Split Floor / Ceiling | Partial · native review pending | No | [Desktop Dark · C1](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/split-floor-ceiling-1440-dark.png>) |

### Arch Sentinel · 23

| Tool | Status | Revit-checked | Screenshot |
| --- | --- | --- | --- |
| Compliance Guard | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/compliance-guard-1440-dark.png>) |
| Coord Plan | Partial · native review pending | No | [Desktop Dark · C1](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/coord-plan-1440-dark.png>) |
| Duplicates Resolver | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/duplicates-resolver-1440-dark.png>) |
| Family Name Editor | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/family-name-editor-1440-dark.png>) |
| Family Name Synchronizer | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/family-name-synchronizer-1440-dark.png>) |
| Filter Usage Checker | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/filter-usage-checker-1440-dark.png>) |
| Group Manager | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/group-manager-1440-dark.png>) |
| In-Place Converter | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/in-place-converter-1440-dark.png>) |
| In-Place Inspector | Done · reviewed path | Yes · native window and capture | [Desktop Dark · C1](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/in-place-inspector-1440-dark.png>) |
| Links Inspector | Done · reviewed path | Yes · native capture | [Desktop Dark · C1](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/links-inspector-1440-dark.png>) |
| Mirrored Auditor | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/mirrored-auditor-1440-dark.png>) |
| Model Health | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/model-health-1440-dark.png>) |
| Model Query Pro | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/model-query-pro-1440-dark.png>) |
| Navis View | Partial · native review pending | No | [Desktop Dark · C1](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/navis-view-1440-dark.png>) |
| Off-Axis Resolver | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/off-axis-resolver-1440-dark.png>) |
| Parameter Colorizer | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/parameter-colorizer-1440-dark.png>) |
| Pin / Unpin Links | Done · reviewed path | Yes · native capture | [Desktop Dark · C1](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/pin-unpin-links-1440-dark.png>) |
| Purge and Merge | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/purge-and-merge-1440-dark.png>) |
| Scope Box Synchronizer | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/scope-box-synchronizer-1440-dark.png>) |
| Section Box | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/section-box-1440-dark.png>) |
| Structural QA | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/structural-qa-1440-dark.png>) |
| Warnings Inspector | Done · reviewed path | Yes · default filters and review panel | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/warnings-inspector-1440-dark.png>) |
| Workset Manager | Partial · native review pending | No | [Desktop Dark](<C:/Users/arnav/agent-tools/wp-c1-shots/browser/workset-manager-1440-dark.png>) |
