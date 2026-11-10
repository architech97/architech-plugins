# Storefront dialog port

Reviewed the four commits on `preview/automation-storefront` individually, then reapplied only the independent dialog, fixture, layout and media changes to `feature/live-demos`. The branch starts at the published Manage Text build, `c5021d2`. This is a source port; the native inspection record and its coverage limits are in `native-verification.md`.

No change was taken into `src/pages/**`, `src/components/**`, `src/styles/site.css`, `vite.config.ts`, `index.html`, `package.json`, `package-lock.json` or `src/data/featured.ts`. The three Manage Text implementation files were preserved. Deployment configuration, the 404 fallback and the application entry point were also left as they were.

| Preview commit | Ported | Left out and reason |
| --- | --- | --- |
| `d2c175b` — Refine Automation storefront and browser workflows for staging | `GeneratedDemo.tsx`, `generatedRegistry.ts`, `generatedWorkflow.ts` and `generated.css`: meaningful sample inputs and scope, action-specific results, validation, review states, accessible control names and usable workflow controls alongside the exported native layout. | Home, catalog, product, pricing, custom-development and demo-gallery page changes and their styles belong to WP-L. Component changes are frozen. Site CSS, Vite and HTML changes are frozen. README, compatibility marketing, product-copy changes, deployment workflow, `main.tsx`, deletion of `public/404.html`, player styling and connector styling are outside the dialog port. |
| `b3caf24` — Align browser dialogs with the deployed Revit 2024 suites | Generated-dialog behavior and fixtures; corrected Detail View tab names in both layout registries; Model Query as the initial Model Query Pro window; native action labels and per-window actions. Ported Sheet Export preflight and format controls, Parameter Manager family tools, Replace Materials impact scan, Match Opening review, Point Cloud On/Off browser behavior, Purge & Merge protection and merge preview, Warnings Inspector stale-scan handling. Ported independent Suite Home implementation, catalog and seven Folio Home images. Added the minimal ribbon-product catalog entries needed to reach Suite Home and Point Cloud On/Off. Ported the two updated featured dialog images and `Check.disabled` support. | All frozen files and WP-L pages/components remain excluded. `FlowDemo.tsx` and `SentinelInspectors.tsx` were not taken: the WP-C1 inspector folders provide their replacements using the new shared fixture and kit. Preview `SENTINEL_COMMANDS` registrations were likewise excluded. DemoPlayer's persistent theme-preference dialog was optional and was left out; the open dialogs retain their existing Dark/Light controls. Unrelated compatibility and product-description changes were omitted. |
| `d4d7cc5` — Match launcher control labels for voice and keyboard navigation | The Suite Home primary control keeps visible text `Open tool` and an accessible name that also identifies the selected tool. | Nothing else: this commit changes only Suite Home. |
| `e0b269d` — Simulate Revit workbook relinking and nested family parameters | Excel to Schedule with workbook copies, worksheet and region choices, eligible existing targets, guarded refresh/relink, retained schedule identities and placements, redraw review and last-run details. Parameter Manager's sample family document, family-parameter workspace, nested association dialog, association constraints and readback. Supporting fixture models, CSS and six explicitly labelled browser-exercise dialog images; reconstruction metadata now points at those images. | No deployment, frozen-page or Manage Text changes were needed. These are fictional browser exercises; no Excel application or Revit document is modified. |

## Independent Suite Home

`SuiteHome.tsx`, `suiteHome.css` and `suiteHomeCatalog.ts` use the existing brand asset helper, catalog, router and demo context. They do not depend on the excluded Home, site CSS, Vite or HTML changes. The minimal `ribbonProducts.ts` / catalog integration exposes Folio, Forge and Sentinel Home and the Point Cloud On/Off split-button exercise. Launcher search, panel filtering, keyboard result navigation, readiness scenarios, theme and tool handoff work inside the existing demo player.

## Registration and precedence

The added Excel to Schedule, Replace Materials, Match Opening and Point Cloud On/Off demos keep the preview's lazy component imports. Suite Home is created lazily for each suite. WP-C1 folder discovery takes precedence over generated/flow fallbacks. Manage Text retains its `c5021d2` crafted entry and implementation.

## Port validation

- `git diff --check` passed after the selective port.
- `npm run build` passed after the selective port. Final combined builds, chunk budgets, browser results and screenshot paths are recorded in the delivery report.
- The source review showed that shared generated-dialog changes affect the fallback renderer used by the remaining layout replicas. It does not establish independent native acceptance of every fallback dialog. Native verification must name the actual states observed and any unavailable or unsafe paths.
- Existing untracked `desktop.ini` files were preserved. No `.git` repair, pruning or ref deletion was performed.
