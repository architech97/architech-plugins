# Shared demo engine

The browser demos use fictional Sample Residence metadata. They do not connect to or modify a Revit document. The shared typed fixture is `src/demo/fixtures/sampleResidence.ts`; the compatibility modules `sample.ts` and `generatedFixtures.ts` keep the earlier demos working.

## Add a tool using only its folder

For a tool already present in the product catalog, create `src/demo/tools/<product-slug>/index.ts` or `index.tsx`. Export a complete `DemoDefinition` named `definition`. Its `productSlug` must match the folder name. The `load` function returns a module with a default React component accepting `DemoContext`.

```tsx
import type { DemoContext, DemoDefinition } from '../../types'

export const definition: DemoDefinition = {
  id: 'example-tool',
  productSlug: 'example-tool',
  kind: 'crafted',
  ribbon: { tab: 'Arch Folio', panel: 'Annotation', button: 'Example Tool' },
  title: 'Example Tool',
  summary: 'Review and apply an action to the fictional sample.',
  basis: ['Based on Commands/ExampleCommand.cs; sample data is fictional.'],
  steps: [
    { id: 'configure', title: 'Set the options', hint: 'Choose a sample input.', target: 'example-options' },
    { id: 'preview', title: 'Review the preview', hint: 'Check the proposed changes.', target: 'example-preview' },
    { id: 'apply', title: 'Apply to the sample', hint: 'Confirm the browser action.', target: 'example-apply' },
  ],
  width: 1000,
  load: () => import('./ExampleTool'),
}
```

The component may also live in `index.tsx`; in that case `load: async () => ({ default: ExampleTool })` is sufficient. Both forms remain lazy. Prefer one index file per folder. During integration, if both an `index.tsx` and an `index.ts` exist for the same slug, the TSX dialog wins; the alternate implementation is preserved on disk. The Split Floor / Ceiling folder currently exercises this precedence.

`registry.ts` discovers these files using a lazy `import.meta.glob`. Importing the registry evaluates no tool implementation. Existing CRAFTED entries take precedence; folder implementations then take precedence over generated-layout and generic-flow fallbacks. Manage Text keeps its original crafted entry and implementation.

The existing gallery asks `demoForProduct` for synchronous, lightweight descriptors derived from product metadata. A route calls `demoById`; on the first visit it suspends on the cached tool import using the application's existing route Suspense boundary. Once the definition resolves, its exact title, source notes, steps, width and component loader hydrate the stable descriptor **before the demo player mounts**. Legacy `index.ts` files may alternatively default-export a partial `ToolDefinition`. Missing metadata and loaders inherit the catalog/layout fallback, including the lazy folder `result.ts` workflow. Result-only folders continue to use `GeneratedDemo.loadGenerated`. Failed or malformed imports surface as errors; they are never silently presented as a passing fallback. There is no eager import of tool UI and no registry edit is needed when adding a folder for a catalog tool.

Adding a completely new product still requires its normal product-catalog entry. Folder discovery adds an implementation to an existing tool; it does not invent product identity, marketing copy or static build routes.

## Shared kit

Import `DialogShell`, `TaskDialogShell`, `ScopeRadios`, `PreviewTable`, `BeforeAfter`, `ConfirmGuard`, `Receipt` and `MiniView` from `../../kit`. Theme, guide completion, rewind, notices and closing are supplied by `DemoContext`. Each component should call `done` with its own definition's step IDs and `rewind` when an input invalidates later steps.

`PreviewTable` provides search, per-row ticks, Tick shown, Clear ticks and Ticked only. `ConfirmGuard` uses a modal HTML dialog so keyboard focus stays inside the decision and Escape cancels. `Receipt` labels outcomes as simulated and can download fictional JSON. `MiniView` supplies SVG plan, sheet and 3D presentations; tool-specific SVG children are supported.

Motion uses the shared tokens and `animateOnce` helper from `kit/motion.ts`. Only transform and opacity are animated, once per action, with 300–900 ms durations. `useReducedMotion` responds to the system preference; before and after remain visible side by side when reduced motion is enabled. Do not add an animation dependency.

## Verification boundaries

Build success verifies TypeScript and bundling. Browser interaction verifies the fictional metadata transitions. Native screenshots verify only the safely opened dialog states named in `native-verification.md`. They do not verify model writes, geometry generation, saving or persistence. Read-only native review must stop before any command that could modify the open model.

## Combined integration snapshot

The integration preserves the parallel suite contributions, their `WorkflowPreview`, `GeneratedDemo.loadGenerated` and result modules. Registry entry discovery supports complete named definitions and legacy default partial definitions without eagerly importing either tool UI or result modules. `toolDiscovery.ts` retains the lazy result-module loader; its former eager metadata table is replaced by registry discovery.
