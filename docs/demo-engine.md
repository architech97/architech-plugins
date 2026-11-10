# Shared demo engine

All demos operate on fictional Sample Residence metadata. The shared dataset in `src/demo/fixtures/sampleResidence.ts` includes levels, views, sheets, rooms, walls, floors, ceilings, notes, links and families. The older `sample.ts` exports point to that fixture.

## Add a tool

For a catalogue tool, use `src/demo/tools/<slug>/index.ts` for lightweight metadata and a lazy `load` function that imports the dialog component. Export a default object that satisfies `ToolDefinition`. The registry discovers the metadata and supplies product identity and defaults. Existing code-built `index.tsx` folders can export a named `definition` with their component; the registry imports that module on demand. Keep component code out of metadata-only indexes.

A tool using an exported dialog layout can provide `src/demo/tools/<slug>/result.ts` without an index. Its default function accepts `WorkflowInput` and returns a sample result, a validation message or `undefined` to use shared behavior. Optional `settings` and `actions` expose controls populated in Revit at runtime. The result module loads only when that tool opens. A result can provide typed scope records and explicit Before and After values.

Existing authored demos take precedence over folder discovery. Manage Text keeps its authored component and registration.

## Preview and apply

Exported dialogs share their control state between Dialog layout and Browser workflow. Choosing an action calculates a preview. The user can tick or untick records before confirming. Selection-dependent outcomes recalculate in the preview, and changing inputs discards an obsolete preview. Confirmation creates a sample receipt. This represents the operation with metadata and stays in the browser.

The shared kit supplies task dialog shells, scope controls, searchable previews, Before/After panels, modal confirmation, SVG mini-views and downloadable sample receipts. Animations run once and use opacity or transforms. Reduced motion disables the animations. The shared guide highlight is finite.

## Evidence

The installed ribbon inventory and native window observations are separate from build and browser checks. The delivery report records which native windows were actually seen. Live Revit commands and public deployment are outside the browser demo runtime.
