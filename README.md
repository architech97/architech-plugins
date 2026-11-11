# ArchiTECH Automation · Plugins website

The public catalogue for ArchiTECH's BIM productivity software: 58 Revit tools in the Arch Folio,
Arch Forge and Arch Sentinel suites, plus ArchiTECH I3D, ArchiTECH Assistant and ArchiTECH MCP Connector workflows for Revit, Rhino, SketchUp, AutoCAD and Blender. Browser walkthroughs use sample data.

The primary site is [architechdesign.in/automation/](https://architechdesign.in/automation/).
The [GitHub Pages preview](https://architech97.github.io/architech-plugins/) remains available for existing links and is marked `noindex`.

## What is in this repository

Website code and public product information only:

- product copy taken from each plugin's own ribbon tooltip and long description;
- dialog screenshots rendered from each plugin's own layout with sample data;
- guided Revit simulations, layout-based dialog explorers, and product-specific workflow simulations on sample data.

It contains **no plugin source code, licensing logic, credentials or client data**. The demos never run Revit,
open a model or call any service.

The AT-01 Sample Residence project board links four demos using fictional rooms, sheets and warning groups. Each demo starts with independent sample state. Sample reports are generated in the browser.

The Home page includes an attributed roof perspective and schematic plan exported from Autodesk's Snowdon Towers sample in Revit 2024. Those views are separate from the AT-01 fixtures. The I3D chair is a desktop result preview.

## Stack

Vite + React + TypeScript, static output for GitHub Pages. No backend.

| Path | Purpose |
|---|---|
| `src/data/` | The catalogue: `tools.generated.json` (generated from the plugin sources), `problems.ts`, `extras.ts` (I3D, MCP, Assistant), `suites.ts`, `catalog.ts` |
| `src/demo/` | The demo framework: `DemoPlayer` (simulated Revit window, guided steps, notifications, log), `ui.tsx` (dialog primitives), `dialog.css` (the plugins' own Dark/Light palette), `sample.ts`, `registry.ts` |
| `src/demo/demos/` | Hand-built Revit demo components |
| `src/pages/` | Home, catalogue, product, demos, pricing, custom development |
| `public/media/` | Dialog renders, I3D captures and sample Blender render |
| `public/demo-layouts/` | Public dialog layout fixtures loaded by the explorers |

## Adding an interactive demo

1. Write `src/demo/demos/<Name>.tsx`: a component that receives `DemoContext`
   (`theme`, `setTheme`, `done(stepId)`, `notify()`, `close()`) and builds the dialog from the primitives in
   `src/demo/ui.tsx`. Give the controls the guide should point at a `demo="..."` prop.
2. Add an entry to `src/demo/registry.ts`: the ribbon location, the guided steps (`id`, `title`, `hint`,
   `target`), and the facts the simulation is based on (`basis`).
3. Map the tool's key to the demo id in `DEMO_BY_KEY` in `src/data/catalog.ts`.

Use the real dialog's labels, options and rules. Do not add capabilities the plugin does not have.

## Ready for later

The data layer and routing are set up for a backend to be added without restructuring: product data is typed
(`src/data/types.ts`), each product has a `status`, and the pricing and inquiry pages are the places where
payments, licensing, accounts and a customer dashboard will connect. Inquiries currently open the visitor's
own email app; nothing is sent or stored by the site.

## Develop

```bash
npm install
npm run dev
npm run build   # type-check and build to dist/
```

Pushing to `main` deploys the preview through `.github/workflows/deploy.yml`.
The build emits static entry points for direct product and demo links. The unified site's
workflow builds the commit pinned in [architech-design](https://github.com/architech97/architech-design)
with `BASE=/automation/` and publishes both divisions in one GitHub Pages deployment.
