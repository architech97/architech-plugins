import type { DemoDefinition } from "../../types";
export const definition: DemoDefinition = {
  id: "model-query-pro",
  productSlug: "model-query-pro",
  kind: "crafted",
  width: 1180,
  ribbon: {
    tab: "Arch Sentinel",
    panel: "Standards",
    button: "Model Query Pro",
  },
  title: "Model Query Pro",
  summary:
    "Build parameter rules and groups, query a sample model, inspect matches and review findings.",
  basis: [
    "ModelQueryWindow, ModelQueryViewModel and QueryEngine supply active-view scope, native presets and rule operators.",
    "ReviewCenterWindow supplies scoped scans and accepted-exception review. The browser uses fictional records and local exercise state. The opening screen and defaults were reviewed in the deployed Revit add-in; subsequent results simulate documented behavior.",
  ],
  steps: [
    {
      id: "configure",
      title: "Choose query scope and rules",
      hint: "Set a category or preset and edit a rule value.",
      target: "query-builder",
    },
    {
      id: "preview",
      title: "Run and inspect the query",
      hint: "Run Query, then inspect the returned element IDs.",
      target: "query-run",
    },
    {
      id: "apply",
      title: "Review a finding",
      hint: "Open Review Center and run the sample review. Record or reopen an exception.",
      target: "query-review",
    },
  ],
  load: () => import("./Dialog"),
};
