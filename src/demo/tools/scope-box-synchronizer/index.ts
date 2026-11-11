import type { DemoDefinition } from "../../types";

export const definition: DemoDefinition = {
  id: "scope-box-synchronizer",
  productSlug: "scope-box-synchronizer",
  kind: "crafted",
  width: 920,
  ribbon: {
    tab: "Arch Sentinel",
    panel: "Coordination",
    button: "Scope Box Sync",
  },
  title: "Scope Box Sync",
  summary:
    "Measure linked scope boxes, review drift and replacement IDs, then synchronize the selected boxes.",
  basis: [
    "ScopeBoxSyncWindow supplies the loaded-link picker, 1.5 mm drift threshold and confirmation before replacing host boxes.",
    "The browser changes fictional box IDs and assignments. The opening screen and defaults were reviewed in the deployed Revit add-in; subsequent results simulate documented behavior.",
  ],
  steps: [
    {
      id: "configure",
      title: "Choose and scan the master link",
      hint: "Scan the fictional linked scope boxes before synchronizing.",
      target: "scope-scan",
    },
    {
      id: "preview",
      title: "Review the selected differences",
      hint: "New and drifted measured boxes start ticked. Select a host box to try active-view assignment.",
      target: "scope-table",
    },
    {
      id: "apply",
      title: "Confirm replacement",
      hint: "Read the new ElementId and view-assignment warning before Replace.",
      target: "scope-sync",
    },
  ],
  load: () => import("./Dialog"),
};
