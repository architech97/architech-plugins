import type { DemoDefinition } from "../../types";
export const definition: DemoDefinition = {
  id: "section-box",
  productSlug: "section-box",
  kind: "crafted",
  width: 580,
  ribbon: {
    tab: "Arch Sentinel",
    panel: "Coordination",
    button: "Section Box",
  },
  title: "Section Box",
  summary:
    "Choose host or linked sample elements, enter padding and review the resulting section box.",
  basis: [
    "Native opening screen was reviewed in Revit: Choose elements for the section box, with equal Host elements and Linked elements choices.",
    "SectionBoxWindow supplies padding chips, target view, link orientation and temporary-isolation controls. The browser picker uses fictional elements and does not access Revit.",
  ],
  steps: [
    {
      id: "configure",
      title: "Choose sample elements",
      hint: "Choose Host elements or Linked elements and finish the sample selection.",
      target: "section-source",
    },
    {
      id: "preview",
      title: "Set padding and target",
      hint: "Enter a non-negative length or use a padding chip.",
      target: "section-padding",
    },
    {
      id: "apply",
      title: "Apply to the sample view",
      hint: "Apply Section Box and inspect the sample bounds.",
      target: "section-apply",
    },
  ],
  load: () => import("./Dialog"),
};
