import type { DemoDefinition } from "../../types";
export const definition: DemoDefinition = {
  id: "workset-manager",
  productSlug: "workset-manager",
  kind: "crafted",
  width: 1180,
  ribbon: {
    tab: "Arch Sentinel",
    panel: "Standards",
    button: "Workset Manager",
  },
  title: "Workset Manager",
  summary:
    "Review workset compliance, edit selected rows and confirm rule-based bulk assignments.",
  basis: [
    "WorksetManagerWindow, WorksetRules and WorksetApply supply selected-row edits, visible-row auto-assignment and the bulk confirmation.",
    "This exercise uses a fictional workshared model. Native UI comparison remains pending.",
  ],
  steps: [
    {
      id: "configure",
      title: "Review workset compliance",
      hint: "Compare the current and expected worksets for each visible row.",
      target: "workset-table",
    },
    {
      id: "preview",
      title: "Edit or choose a BEP assignment",
      hint: "Edit a row workset, or choose Auto-Assign (Prefix) to target non-compliant rows.",
      target: "workset-auto",
    },
    {
      id: "apply",
      title: "Apply the assignment",
      hint: "Review bulk scope before confirming, then read the updated worksets.",
      target: "workset-apply",
    },
  ],
  load: () => import("./Dialog"),
};
