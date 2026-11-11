import type { DemoDefinition } from "../../types";

export const definition: DemoDefinition = {
  id: "family-name-synchronizer",
  productSlug: "family-name-synchronizer",
  kind: "crafted",
  width: 1120,
  ribbon: {
    tab: "Arch Sentinel",
    panel: "Standards",
    button: "Family Name Sync",
  },
  title: "Family Name Sync",
  summary:
    "Compare family names with a reference model or mapping file, review matched families and confirm selected renames.",
  basis: [
    "FamilyNameSyncCommand supplies the three initial choices and file-picker titles. FamilyNameSyncWindow supplies the filtered rename scope and confirmation.",
    "Fictional browser reference files are used for the comparison. The opening screen and defaults were reviewed in the deployed Revit add-in; subsequent results simulate documented behavior.",
  ],
  steps: [
    {
      id: "configure",
      title: "Choose a comparison source",
      hint: "Choose a reference model or a mapping file and open a fictional sample.",
      target: "sync-source",
    },
    {
      id: "preview",
      title: "Review mapped families",
      hint: "Compare the current and container names. Select all applies to the visible mapped rows.",
      target: "sync-families",
    },
    {
      id: "apply",
      title: "Confirm the family names",
      hint: "Rename the ticked non-compliant families. Every instance of each selected family is affected.",
      target: "sync-rename",
    },
  ],
  load: () => import("./Dialog"),
};
