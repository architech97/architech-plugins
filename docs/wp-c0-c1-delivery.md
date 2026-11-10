# WP-C0 / WP-C1 delivery

Branch: `feature/live-demos`. Baseline: `c5021d2`. No merge to main, deployment or change to `automation.ref` is part of this delivery.

## Implementation

The eight code-built or TaskDialog tools now have source-based dialogs, fictional Sample Residence inputs, working options, previews, guarded browser actions, SVG views and simulated receipts. `sampleResidence.ts` owns the typed common metadata; compatibility modules retain existing imports. The kit supplies dialog chrome, TaskDialog choices, scope radios, tick/search preview tables, before/after, confirmation, receipts, SVG views, motion tokens and reduced-motion handling.

Lazy folder discovery preserves existing crafted entries, including Manage Text, and takes precedence over generic fallbacks. It also supports the parallel suite's default partial definitions and lazy result workflows. The complete managed definition is available before the player mounts. Both legacy and new entries remain on disk; a TSX entry wins an overlapping TS index.

The reviewed storefront port includes workbook relinking, nested family associations, source-aligned labels and layout metadata, plus independent Suite Home. Per-commit inclusions and exclusions are in `storefront-port.md`.

## Verification

The actual requested worktree also passes both build commands. All **107 production JS/CSS assets match the browser-tested integration build byte for byte**, and all 26 protected source files match the baseline after Git line-ending normalization.

The final combined package passes both `npm run build` and PowerShell `$env:BASE='/automation/'; npm run build`. Browser flows cover all eight new tools plus Manage Text at 1440 ? 1000 and 390 ? 844, light theme, invalid/cancel/confirm paths, current-row download readback, keyboard focus and reduced motion. Detailed cases, final production-preview checks and screenshot paths are in `inspector-browser-verification.md`.

The gallery fetches no tool implementation chunks. A new tool fetches its own lazy module and shared support; cold links load the correct source-specific guide. Shared fixes stop inherited reduced-motion colour transitions in Manage Text without editing its frozen files. New kit actions share a three-animation budget; inherited 120 ms control transitions, repeated guide pulses and toast animation are disabled for kit players. Only transform and opacity animate, once per action, for 300?900 ms.

| New tool | JavaScript chunk, raw | gzip |
| --- | ---: | ---: |
| `spot-elevation-line` | 6.35 KB | 2.52 KB |
| `split-region-with-line` | 8.77 KB | 3.33 KB |
| `split-floor-ceiling` | 7.90 KB | 2.97 KB |
| `coord-plan` | 8.95 KB | 3.23 KB |
| `navis-view` | 13.88 KB | 4.61 KB |
| `links-inspector` | 7.33 KB | 3.04 KB |
| `pin-unpin-links` | 5.38 KB | 2.27 KB |
| `in-place-inspector` | 6.86 KB | 2.79 KB |

The shared kit JS and CSS total 14.55 KB. The typed Sample Residence data is a separate shared chunk. All eight new tool chunks are below 35 KB and the kit is below 25 KB. This is a bundle-size check, not a Lighthouse or mobile 4G benchmark.

Native opening states independently observed in this run: Links Inspector, Pin / Unpin Links and In-Place Inspector. Later MCP launches expired before starting. Coord Plan and Navis View were not invoked without a complete existence preflight because their launch can create a view. Other native comparisons and source-based limits are listed in `native-verification.md`. No model writes, native Apply/OK confirmations, save, sync or restart were performed.

## Concurrent work and acceptance boundary

Another session committed broader suite changes to this same branch while this package was active. Those commits and their additional tool folders were preserved. Integration was prepared and checked in isolated copies under `C:/Users/arnav/agent-tools/`, then only explicit reviewed paths were staged. The earlier `docs/live-demo-verification.md` describes the parallel baseline; its wider 58-tool results are not a claim that the subsequent combined changes received an exhaustive 58-tool re-test.

The branch history includes an independent Suite Home port and a concurrent removal. The final reviewed integration retains Suite Home because it works with the frozen page, stylesheet, Vite and HTML files unchanged, as permitted by the brief. The minimal catalog changes expose the launcher without taking the storefront page redesign.

Known limits: two existing moderate npm advisories in the React Router dependency chain remain because dependency files are frozen. Native transaction/geometry/save acceptance, clean-machine installation and Lighthouse were outside these browser checks. Existing desktop.ini files were preserved; no git garbage collection, pruning or ref repair was performed.

## Local preview

From the worktree:

```powershell
$env:BASE='/automation/'
npm run build
npm run preview -- --host 127.0.0.1 --port 5178 --strictPort
```

Open `http://127.0.0.1:5178/automation/demos/`. For development without the BASE override, use `npm run dev -- --host 127.0.0.1 --port 5177` and open `/architech-plugins/demos/`.

Screenshot root: `C:/Users/arnav/agent-tools/wp-c1-shots/`. Native captures stay in its `native/` folder and are not public media.
