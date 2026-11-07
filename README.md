# ArchiTECH Automation · Plugins website (staging)

The commercial marketplace for ArchiTECH's BIM productivity software: 66 products (58 Revit tools in the
Arch Folio, Arch Forge and Arch Sentinel suites, plus ArchiTECH-I3D, the AI & MCP connectors and the pyRevit
edition), with interactive browser demos of the real plugin dialogs.

This is a **staging preview**. It is separate from the ArchiTECH Design website (architechdesign.in), which
this repository does not touch. The site is marked `noindex` until it is approved.

## What is in this repository

Website code and public product information only:

- product copy taken from each plugin's own ribbon tooltip and long description;
- dialog screenshots rendered from each plugin's own layout with sample data;
- interactive simulations of selected dialogs, running on invented sample data.

It contains **no plugin source code, licensing logic, credentials or client data**. The demos never run Revit,
open a model or call any service.

## Stack

Vite + React + TypeScript, static output for GitHub Pages. No backend.

| Path | Purpose |
|---|---|
| `src/data/` | The catalogue: `tools.generated.json` (generated from the plugin sources), `problems.ts`, `extras.ts` (I3D, MCP, Assistant, pyRevit), `suites.ts`, `catalog.ts` |
| `src/demo/` | The demo framework: `DemoPlayer` (simulated Revit window, guided steps, notifications, log), `ui.tsx` (dialog primitives), `dialog.css` (the plugins' own Dark/Light palette), `sample.ts`, `registry.ts` |
| `src/demo/demos/` | One component per interactive demo |
| `src/pages/` | Home, catalogue, product, demos, pricing, custom development |
| `public/media/` | Dialog renders (WebP, Dark and Light) and I3D media |

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

Pushing to `main` deploys `dist/` to GitHub Pages through `.github/workflows/deploy.yml`. For a custom domain,
build with `BASE=/` and update `public/404.html`.
