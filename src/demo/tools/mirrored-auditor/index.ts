import type { DemoDefinition } from "../../types";

export const definition: DemoDefinition = {
  id: "mirrored-auditor",
  productSlug: "mirrored-auditor",
  kind: "crafted",
  width: 1080,
  ribbon: {
    tab: "Arch Sentinel",
    panel: "Model Health",
    button: "Mirrored Auditor",
  },
  title: "Mirrored Auditor",
  summary:
    "Separate mirror warnings from valid hand and facing flips, inspect the selected instances and review eligible corrections.",
  basis: [
    "MirroredAuditorWindow supplies the empty initial tick selection, MIRROR WARNING classification and Resolve confirmation.",
    "The browser preserves fictional positions and reports an unchanged protected instance. The opening screen and defaults were reviewed in the deployed Revit add-in; subsequent results simulate documented behavior.",
  ],
  steps: [
    {
      id: "configure",
      title: "Review mirror warnings",
      hint: "Compare the mirror warnings with the valid window flip.",
      target: "mirror-options",
    },
    {
      id: "preview",
      title: "Tick mirrored instances",
      hint: "Use Tick all mirrored or choose individual rows. Valid flips are kept.",
      target: "mirror-table",
    },
    {
      id: "apply",
      title: "Confirm the correction",
      hint: "Resolve eligible instances and inspect the unchanged protected sample.",
      target: "mirror-resolve",
    },
  ],
  load: () => import("./Dialog"),
};
