# Selective storefront port

Base: `c5021d2` on `feature/live-demos`. The port was checked against the installed Revit 2024 ribbon inventory. The 58 product commands exclude duplicate ribbon items, Suite Home, Dialog Theme, and the Point Cloud menu and visibility utility.

| Storefront commit | Ported into the demo work | Skipped |
| --- | --- | --- |
| `d2c175b` | Exported layout renderer, responsive browser workflow controls, accessible control labels, sample choices, action-specific validation and receipts. | Page layouts, navigation, marketing copy, site styles, compatibility changes, config and deployment. |
| `b3caf24` | Native Detail View tab labels and Model Query opening window. Sheet Export and Parameter Manager controls, Match Opening, Replace Materials, Purge & Merge, Warnings Inspector and suite-specific fixture behavior. | Suite Home and its assets, extra ribbon product entries, alternate Sentinel inspector components, featured page images and theme preference settings. The C1 tool folders supply the inspector demos. |
| `d4d7cc5` | No changes. | The only change was the Suite Home launcher's accessible button name. |
| `e0b269d` | The Excel to Schedule sample workbook, cell-region controls, refresh/relink review, and retained schedule identity. Parameter Manager's nested family controls and association readback. The six supporting browser exercise images are labelled as reconstructions. | Page, deployment and catalogue changes. |

Manage Text keeps the dedicated component and registered workflow from `c5021d2`. Shared dialog work applies to exported layouts and other tools. Sample data and the browser's receipts stay local to the demo. The public site and deployment pin were outside this work package.
