import type { DemoDefinition } from "../../types";

export const definition: DemoDefinition = {
  id: "group-manager",
  productSlug: "group-manager",
  kind: "crafted",
  width: 1100,
  ribbon: { tab: "Arch Sentinel", panel: "Clean Up", button: "Group Manager" },
  title: "Group Manager",
  summary:
    "Browse detail and model groups, inspect their instances, and dissolve selected model groups after reviewing the confirmation.",
  basis: [
    "GroupManagerCommand and GroupBrowserWindow drive the three runtime tabs, read-only browsing and Ungroup controls.",
    "This simulation uses fictional group types and instances. The opening screen and defaults were reviewed in the deployed Revit add-in; subsequent results simulate documented behavior.",
  ],
  steps: [
    {
      id: "configure",
      title: "Browse a group mode",
      hint: "Compare Detail groups with Model groups, then open Ungroup.",
      target: "group-modes",
    },
    {
      id: "preview",
      title: "Review a group type",
      hint: "Use Isolate or Select to inspect a sample group. Tick a placed model type to ungroup.",
      target: "group-table",
    },
    {
      id: "apply",
      title: "Confirm Ungroup",
      hint: "Read the instance count and member-preservation message before confirming.",
      target: "group-ungroup",
    },
  ],
  load: () => import("./Dialog"),
};
