export interface QueryElement {
  id: number;
  category: string;
  family: string;
  type: string;
  level: string;
  active: boolean;
  selected: boolean;
  values: Record<string, string>;
}
export const ELEMENTS: QueryElement[] = [
  {
    id: 301144,
    category: "Walls",
    family: "Basic Wall",
    type: "Interior Partition",
    level: "Level 01",
    active: true,
    selected: false,
    values: {
      Comments: "TODO verify finish",
      Workset: "Workset1",
      Mark: "",
      "Fire Rating": "",
      Mirrored: "No",
      "Has Flip Controls": "No",
      Area: "12.4",
    },
  },
  {
    id: 348211,
    category: "Doors",
    family: "Single Flush",
    type: "900 × 2100 mm",
    level: "Level 01",
    active: true,
    selected: true,
    values: {
      Comments: "Internal",
      Workset: "Architecture",
      Mark: "D-01",
      "Fire Rating": "60",
      Mirrored: "Yes",
      "Has Flip Controls": "Yes",
      Area: "1.89",
    },
  },
  {
    id: 348222,
    category: "Windows",
    family: "Fixed Window",
    type: "1200 × 1500 mm",
    level: "Level 01",
    active: true,
    selected: false,
    values: {
      Comments: "External",
      Workset: "Architecture",
      Mark: "W-01",
      "Fire Rating": "0",
      Mirrored: "No",
      "Has Flip Controls": "Yes",
      Area: "1.8",
    },
  },
  {
    id: 410022,
    category: "Rooms",
    family: "Room",
    type: "Room",
    level: "Level 02",
    active: false,
    selected: true,
    values: {
      Comments: "TEMP review",
      Workset: "Interiors",
      Mark: "",
      "Fire Rating": "",
      Mirrored: "No",
      "Has Flip Controls": "No",
      Area: "0",
      "Floor Finish": "",
      "Wall Finish": "Paint",
      "Ceiling Finish": "Paint",
      "Base Finish": "Skirting",
    },
  },
  {
    id: 372105,
    category: "Casework",
    family: "Base Cabinet",
    type: "600 mm",
    level: "Level 02",
    active: false,
    selected: false,
    values: {
      Comments: "Kitchen",
      Workset: "Interiors",
      "Type Mark": "",
      Manufacturer: "",
      Mirrored: "No",
      "Has Flip Controls": "No",
    },
  },
];
export const CATEGORIES = ["Casework", "Doors", "Rooms", "Walls", "Windows"];
export const PARAMETERS = [
  "Comments",
  "Workset",
  "Mark",
  "Fire Rating",
  "Mirrored",
  "Has Flip Controls",
  "Area",
  "Category",
  "Family",
  "Type",
  "Level",
  "Type Mark",
  "Manufacturer",
  "Floor Finish",
  "Wall Finish",
  "Ceiling Finish",
  "Base Finish",
];
export const OPERATORS = [
  "Equals",
  "NotEquals",
  "Contains",
  "NotContains",
  "StartsWith",
  "EndsWith",
  "IsEmpty",
  "IsNotEmpty",
  "MatchesRegex",
  "GreaterThan",
  "GreaterThanOrEqual",
  "LessThan",
  "LessThanOrEqual",
];
export const PRESETS = [
  "— Custom Query —",
  "QA: Unassigned / Default Worksets",
  "QA: Missing Mark / Tag on Key Categories",
  "QA: Missing Fire Rating on Barriers",
  "QA: Placeholder Comments ('TODO' / 'TEMP')",
  "QA: Mirrored Doors / Windows",
  "QA: Mirrored Candidates (no flip controls)",
  "QA: Unplaced / Zero Area Rooms",
  "Architecture: Door / window type marks",
  "Interiors: FF&E type marks",
  "Interiors: FF&E manufacturer information",
  "Interiors: Room finish information",
];
export interface Rule {
  id: number;
  parameter: string;
  operator: string;
  value: string;
  matchCase: boolean;
}
export interface Group {
  id: number;
  logic: string;
  rules: Rule[];
}
export const firstRule: Rule = {
  id: 1,
  parameter: "Comments",
  operator: "Contains",
  value: "",
  matchCase: false,
};
export const valueOf = (element: QueryElement, parameter: string) => {
  const properties: Record<string, string> = {
    Category: element.category,
    Family: element.family,
    Type: element.type,
    Level: element.level,
  };
  return properties[parameter] ?? element.values[parameter] ?? "";
};
export const sampleInspection = (element: QueryElement) =>
  "Document: Sample Residence\nElement: " +
  element.type +
  " | ID " +
  element.id +
  "\nCategory: " +
  element.category +
  "\nView: Level 01 · Floor Plan | ID 101\n\n" +
  "No hiding cause was confirmed by these checks. This does not prove the element is visible.\nNot assessed: import/point-cloud global switches, crop/section box, view range, phases, design options, discipline/detail level, family visibility, occlusion and linked-document contents.\nInspection changes nothing. Select ID changes selection; Show ID asks Revit to locate the instance and may change the active view.";

export function ruleMatches(element: QueryElement, rule: Rule) {
  const original = valueOf(element, rule.parameter);
  const before = rule.matchCase ? original : original.toLowerCase();
  const target = rule.matchCase ? rule.value : rule.value.toLowerCase();
  switch (rule.operator) {
    case "Equals":
      return before === target;
    case "NotEquals":
      return before !== target;
    case "Contains":
      return before.includes(target);
    case "NotContains":
      return !before.includes(target);
    case "StartsWith":
      return before.startsWith(target);
    case "EndsWith":
      return before.endsWith(target);
    case "IsEmpty":
      return !original.trim();
    case "IsNotEmpty":
      return Boolean(original.trim());
    case "GreaterThan":
      return Boolean(original.trim()) && Number(original) > Number(rule.value);
    case "GreaterThanOrEqual":
      return Boolean(original.trim()) && Number(original) >= Number(rule.value);
    case "LessThan":
      return Boolean(original.trim()) && Number(original) < Number(rule.value);
    case "LessThanOrEqual":
      return Boolean(original.trim()) && Number(original) <= Number(rule.value);
    case "MatchesRegex":
      return new RegExp(rule.value, rule.matchCase ? "u" : "iu").test(original);
    default:
      return false;
  }
}
export const combine = (tests: boolean[], logic: string) =>
  !tests.length ||
  (logic === "ALL (AND)" ? tests.every(Boolean) : tests.some(Boolean));

export function presetRules(index: number): {
  logic: string;
  rules: Rule[];
  categories: string[];
} {
  const make = (
    parameter: string,
    operator: string,
    value: string,
    id = 1,
  ): Rule => ({ id, parameter, operator, value, matchCase: false });
  switch (index) {
    case 1:
      return {
        logic: "ANY (OR)",
        rules: [
          make("Workset", "Equals", "Workset1"),
          make("Workset", "Equals", "Shared Levels and Grids", 2),
        ],
        categories: [],
      };
    case 2:
      return {
        logic: "ALL (AND)",
        rules: [make("Mark", "IsEmpty", "")],
        categories: ["Doors", "Windows"],
      };
    case 3:
      return {
        logic: "ANY (OR)",
        rules: [
          make("Fire Rating", "IsEmpty", ""),
          make("Fire Rating", "Equals", "0", 2),
        ],
        categories: ["Walls", "Doors"],
      };
    case 4:
      return {
        logic: "ALL (AND)",
        rules: [
          make(
            "Comments",
            "MatchesRegex",
            "\\b(TODO|TEMP|FIXME|CHECK|TBD|\\?\\?\\?)\\b",
          ),
        ],
        categories: [],
      };
    case 5:
      return {
        logic: "ALL (AND)",
        rules: [make("Mirrored", "Equals", "Yes")],
        categories: ["Doors", "Windows"],
      };
    case 6:
      return {
        logic: "ALL (AND)",
        rules: [
          make("Mirrored", "Equals", "Yes"),
          make("Has Flip Controls", "Equals", "No", 2),
          make("Category", "NotEquals", "Curtain Panels", 3),
          make("Category", "NotEquals", "Curtain Wall Mullions", 4),
        ],
        categories: [],
      };
    case 7:
      return {
        logic: "ANY (OR)",
        rules: [
          make("Area", "LessThanOrEqual", "0"),
          make("Level", "IsEmpty", "", 2),
        ],
        categories: ["Rooms"],
      };
    case 8:
      return {
        logic: "ANY (OR)",
        rules: [make("Type Mark", "IsEmpty", "")],
        categories: ["Doors", "Windows"],
      };
    case 9:
      return {
        logic: "ANY (OR)",
        rules: [make("Type Mark", "IsEmpty", "")],
        categories: ["Casework"],
      };
    case 10:
      return {
        logic: "ANY (OR)",
        rules: [make("Manufacturer", "IsEmpty", "")],
        categories: ["Casework"],
      };
    case 11:
      return {
        logic: "ANY (OR)",
        rules: [
          "Floor Finish",
          "Wall Finish",
          "Ceiling Finish",
          "Base Finish",
        ].map((parameter, index) => make(parameter, "IsEmpty", "", index + 1)),
        categories: ["Rooms"],
      };
    default:
      return { logic: "ALL (AND)", rules: [{ ...firstRule }], categories: [] };
  }
}
