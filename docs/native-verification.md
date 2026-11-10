# Native verification ? WP-C0 / WP-C1

Verified on 11 November 2026 against the open Revit 2024 host. Source root: `D:/ArchiTECH/ArchiTECH - Architecture/ArchiTECH - Revit API/ArchiTECH - C# Plugin/`. Source files were read only. All web model records are fictional Sample Residence data; native captures were not used to populate that fixture.

## Observed native dialogs

| Tool | Native state actually observed | Match and corrections |
| --- | --- | --- |
| Links Inspector | Opening window, dark theme, complete table and footer. MCP queued the exact installed ribbon command; the native window was independently observed. | Matched Link Name, Status, Type, Path / View, Instances, Pinned, Severity, Recommendation; single-row selection; Isolate in 3D, Delete Link, Export to Excel, Close. Removed the brief's invented Refresh/tick controls. The source supplies deletion and unloaded-link warnings; those guards were exercised only in the web fixture. |
| Pin / Unpin Links | Opening window, dark theme, grid, four bulk actions, Refresh and Close. MCP queued the exact installed ribbon command; the native window was independently observed. | Matched Kind, Link Name, Element ID, Pin State. Kept Pin all links, Unpin all links, Pin RVT links and Pin CAD links. No native tick/search/scope controls were invented. Bulk action confirmation text and counts come from the C# source and are tested in the browser. |
| In-Place Inspector | Opening window observed through the native ribbon after MCP dispatch expired before starting. | Corrected title to In-Place Families Inspector. Matched Family Name, Category, Instances, Severity, Recommendation and Show in 3D View / Select / Delete Family / Export to Excel / Close. Convert is a recommendation, not a button. Severity thresholds and deletion prompts follow the source. |

Native screenshots are local evidence, saved as PNG at `C:/Users/arnav/agent-tools/wp-c1-shots/native/{links-inspector,pin-unpin-links,in-place-inspector}_open.png`. These captures contain host-specific information and are not shipped as public demo media. Every inspected window was closed; the final observed host state was the original open sheet with no plugin dialog.

## Source-based coverage and native limits

| Tool/state | Replica basis and native inspection limit |
| --- | --- |
| Spot Elev Override | `Commands/SpotElevationCommand.cs`, `App.cs`, `Lib/ArchUi/ArchiTechMessage.cs`, shared `SelectFromList.cs`. Includes Solid default, pattern-only clearing, Active view / Selected sheets-views / Whole project, actual override counts, Yes/No and result text. A native opening state could not be independently observed after the connector began expiring queued requests. |
| Split Region With Line | `Commands/SplitCommands.cs`, `Core/RegionSplitter.cs`, `Core/SplitGuards.cs`, `App.cs`, message helper. Models pick-then-act and the conditional dependent guard. Native selection/guard/result states remain unobserved; advancing a real split was outside the read-only boundary. |
| Split Floor / Ceiling | `Commands/SplitCommands.cs`, `Core/FloorCeilingSplitter.cs`, `Core/SplitGuards.cs`, `App.cs`, message helper. Uses disjoint outer regions with openings, reviewed dependent IDs, skip/all choices and per-element results. Native pick/guard/result states remain unobserved; no real floor/ceiling was selected for splitting. |
| Coord Plan | `Commands/CoordPlanCommand.cs`, `Core/CoordPlanBuilder.cs`, `App.cs`, message helper. Uses the lowest level and exact existing-view choices, sheet-placement warning and result. Native invocation can immediately create when no matching plan exists. Complete matching-view existence could not be established, so it was not launched. |
| Navis View | `Commands/NavisViewCommand.cs`, `Commands/BatchViews.cs`, `Core/NavisViewBuilder.cs`, `Core/BatchViewNames.cs`, `Core/CurtainWallIsolation.cs`, `App.cs`, message helper. Normal hides links; Shift keeps links; Ctrl batches. Batch always hides links and skips occupied names. Native invocation can immediately create without an existing view, so it was not launched without a complete preflight. |
| Manage Text | Implementation and CRAFTED registry entry remain unchanged from `c5021d2`. An MCP launch request expired before starting; no native Manage Text screenshot was obtained. Browser regression coverage is recorded separately. |

The bridge was available for initial ribbon discovery, Links Inspector, Pin / Unpin Links and one view-list read. Later operations returned `authoring_dispatched: false`, `executionStarted: false`, `cancelled_before_start`, and a 10-second busy timeout. Representative receipt IDs: `a9491649-a56a-41ff-a842-29698621cd8b` (In-Place launch), `8c5dcc7e-d66b-42d6-abd5-ec9de1bcfdc6` (Manage Text launch), and `19990ebb-cc1f-44a5-bd38-12ce9c4d970d` (view preflight). No expired request was replayed as an unknown operation. The In-Place ribbon click was independently observed later. No transaction code, Apply, OK, model-changing confirmation, save, sync, document close or Revit restart was performed.

## Storefront-port native coverage

The port also touches Suite Home (three suites), Sheet Export, Parameter Manager including family and nested-parameter tools, Replace Materials, Match Opening, Purge & Merge, Warnings Inspector, Excel to Schedule and its relink review, Detail View metadata and Model Query's initial window. These use the reviewed preview branch and native source/layout evidence; their native states were not independently reopened in this run after connector timeouts. Nested Parameters additionally requires an active family document; no document was changed to reach it. Point Cloud On/Off changes view visibility immediately, so its native command was deliberately not invoked. Shared GeneratedDemo changes affect other fallback replicas, whose native acceptance is also open.

## UI fidelity and simulation boundary

The shared TaskDialog shell follows `Lib/ArchUi/ArchiTechMessage.cs`: branded header, body message and status dot, visible monospaced details, common buttons in native order, stacked long choices and safe No/Cancel focus. Its browser theme control sits outside the native header. Browser-only selection fixtures, previews, before/after drawings and receipts are labelled separately. The code-built inspectors retain their source grids and action labels. Browser Export to Excel produces a clearly identified CSV; it does not claim to produce a Revit XLSX export. The source-based guards and web results have not been accepted as live Revit operations.
