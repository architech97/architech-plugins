import type { DemoDefinition } from "../../types";
export const definition: DemoDefinition = {
  id: "parameter-colorizer",
  productSlug: "parameter-colorizer",
  kind: "crafted",
  width: 940,
  ribbon: {
    tab: "Arch Sentinel",
    panel: "Standards",
    button: "Parameter Colorizer",
  },
  title: "Parameter Colorizer",
  summary:
    "Group visible elements by a parameter, apply their group colors and restore their original overrides.",
  basis: [
    "ColorizerWindow, ColorizerViewModel and ColorizerEngine supply the controls, visible-view scope and restore behavior.",
    "The browser uses fictional elements. The opening screen and defaults were reviewed in the deployed Revit add-in; subsequent results simulate documented behavior.",
  ],
  steps: [
    {
      id: "configure",
      title: "Choose a category and parameter",
      hint: "Compare the distinct values and element counts.",
      target: "colorize-fields",
    },
    {
      id: "preview",
      title: "Apply group colors",
      hint: "Apply colors to the current sample view and review the colored elements.",
      target: "colorize-apply",
    },
    {
      id: "apply",
      title: "Restore the original overrides",
      hint: "Use Restore originals to return the sample view to its prior appearance.",
      target: "colorize-restore",
    },
  ],
  load: () => import("./Dialog"),
};
