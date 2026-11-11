import type { DemoDefinition } from "../../types";
export const definition: DemoDefinition = {
  id: "filter-usage-checker",
  productSlug: "filter-usage-checker",
  kind: "crafted",
  width: 1180,
  ribbon: {
    tab: "Arch Sentinel",
    panel: "Standards",
    button: "Filter Usage Checker",
  },
  title: "Filter Usage Checker",
  summary:
    "Select a filter, review its view and template usage, then apply the pending add or remove operations.",
  basis: [
    "FilterUsageWindow and FilterScan supply the view-type rail, selected-filter detail and pending change set.",
    "The browser updates fictional view/filter assignments. The opening screen and defaults were reviewed in the deployed Revit add-in; subsequent results simulate documented behavior.",
  ],
  steps: [
    {
      id: "configure",
      title: "Choose a filter",
      hint: "Select a row to list views and templates that can host that filter.",
      target: "filter-summary",
    },
    {
      id: "preview",
      title: "Edit its view usage",
      hint: "Tick a view to add the filter, or untick to remove it.",
      target: "filter-targets",
    },
    {
      id: "apply",
      title: "Apply pending changes",
      hint: "Apply the current filter change set and inspect its updated counts.",
      target: "filter-apply",
    },
  ],
  load: () => import("./Dialog"),
};
