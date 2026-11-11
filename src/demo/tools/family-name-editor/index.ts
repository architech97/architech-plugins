import type { DemoDefinition } from "../../types";
export const definition: DemoDefinition = {
  id: "family-name-editor",
  productSlug: "family-name-editor",
  kind: "crafted",
  width: 1180,
  ribbon: {
    tab: "Arch Sentinel",
    panel: "Standards",
    button: "Family Name Editor",
  },
  title: "Family Name Editor",
  summary:
    "Review family and type names against a naming convention, edit proposed names and confirm visible changes.",
  basis: [
    "FamilyNameEditorWindow supplies family/type scope, editable name columns, BEP rules and the visible-scope rename confirmation.",
    "Fictional family and type names are used. The opening screen and defaults were reviewed in the deployed Revit add-in; subsequent results simulate documented behavior.",
  ],
  steps: [
    {
      id: "configure",
      title: "Choose family or type names",
      hint: "Review the selected categories and the convention.",
      target: "naming-scope",
    },
    {
      id: "preview",
      title: "Edit proposed names",
      hint: "Edit a name or choose Auto-Assign for non-compliant rows.",
      target: "naming-table",
    },
    {
      id: "apply",
      title: "Confirm naming changes",
      hint: "Review the visible rename targets before confirming.",
      target: "naming-apply",
    },
  ],
  load: () => import("./Dialog"),
};
