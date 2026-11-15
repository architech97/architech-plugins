# ArchiTECH Automation · Plugins website

The public catalogue for ArchiTECH's BIM productivity software: the Revit add-ins in the Arch Folio,
Arch Forge and Arch Sentinel suites, the three suite homes, the Point Cloud On/Off toggle, ArchiTECH I3D,
ArchiTECH Assistant and MCP connectors for Revit, Rhino, SketchUp, AutoCAD and Blender. The live counts are
published at `stats.json` (`products`, `revitTools`, `suiteHomes`, `utilities`, `desktopApps`, `connectors`).
Every tool is shown through its real dialogs.

The primary site is [architechdesign.in/automation/](https://architechdesign.in/automation/).
The [GitHub Pages preview](https://architech97.github.io/architech-plugins/) remains available for existing links and is marked `noindex`.

## What is in this repository

Website code and public product information only:

- product copy taken from each plugin's own ribbon tooltip and long description;
- real dialog pictures: Revit and desktop screenshots, and renders of each product's own window classes with sample data
  (project names and file paths are sample values). There are no recreated or simulated dialogs.

It contains **no plugin source code, licensing logic, credentials or client data**. The site never runs Revit,
opens a model or calls any service.

## Stack

Vite + React + TypeScript, static output for GitHub Pages. No backend.

| Path | Purpose |
|---|---|
| `src/data/` | The catalogue: `tools.generated.json` (generated from the plugin sources), `problems.ts`, `extras.ts` (I3D, MCP, Assistant), `suites.ts`, `catalog.ts` |
| `src/data/dialogs.generated.json` | The dialog mapping: every picture shown per product, generated from the dialog inventory by `scripts/build-dialogs.py` |
| `src/components/DialogGallery.tsx` | The stepper: a tab per dialog state, Dark/Light where a light image exists, 1:1 zoom view |
| `src/pages/` | Home, catalogue, product, dialog library (`/demos`), coverage, connect |
| `public/dialogs/` | The dialog images (WebP; `-720` copies for small screens and thumbnails) |
| `public/media/` | Product captures, the hero drawings and brand media |

## Updating the dialog pictures

```bash
python scripts/build-dialogs.py <folder with dialog_inventory.csv, rendered/, clean/, clean_additional/>
```

The script copies the WebP files named in the inventory into `public/dialogs/` (names unchanged), writes the 720px copies and
regenerates `src/data/dialogs.generated.json` and `src/data/hero.generated.json`. Captions, counts and the coverage page are all
derived from that file; nothing is typed per component. It needs Python with Pillow.

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
The build emits static entry points for direct product and dialog links. The unified site's
workflow builds the commit pinned in [architech-design](https://github.com/architech97/architech-design)
with `BASE=/automation/` and publishes both divisions in one GitHub Pages deployment.
