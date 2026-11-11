import { useRef, useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, SearchBox, Select, TextBox } from "../../ui";
import { ConfirmGuard, DialogShell, Receipt } from "../../kit";
import { downloadCsv } from "../../demos/craftedTools";
import "./style.css";

const worksets = ["Architecture", "Interiors", "Structure", "Workset1"];
const categories = ["Doors", "Windows", "Casework", "Structural Columns"];
interface Row {
  id: number;
  family: string;
  type: string;
  category: string;
  current: string;
  count: number;
}
interface Rule {
  prefix: string;
  category: string;
  workset: string;
}
const initial: Row[] = [
  {
    id: 9101,
    family: "AR-DOR-Single Flush",
    type: "900 × 2100 mm",
    category: "Doors",
    current: "Workset1",
    count: 12,
  },
  {
    id: 9102,
    family: "AR-WIN-Fixed",
    type: "1200 × 1500 mm",
    category: "Windows",
    current: "Architecture",
    count: 8,
  },
  {
    id: 9103,
    family: "INT-CSW-Base Cabinet",
    type: "600 mm",
    category: "Casework",
    current: "Architecture",
    count: 4,
  },
  {
    id: 9104,
    family: "ST-COL-Rectangular",
    type: "300 × 450 mm",
    category: "Structural Columns",
    current: "Structure",
    count: 6,
  },
];
const initialRules: Rule[] = [
  { prefix: "AR-", category: "", workset: "Architecture" },
  { prefix: "INT-", category: "", workset: "Interiors" },
  { prefix: "ST-", category: "", workset: "Structure" },
];
export default function WorksetManager(ctx: DemoContext) {
  const [rows, setRows] = useState(initial);
  const [rules, setRules] = useState(initialRules);
  const [draftRules, setDraftRules] = useState(initialRules);
  const [ruleRow, setRuleRow] = useState(-1);
  const [configStatus, setConfigStatus] = useState("");
  const configFile = useRef<HTMLInputElement>(null);
  const [cats, setCats] = useState(categories);
  const [families, setFamilies] = useState<string[]>([]);
  const [catQuery, setCatQuery] = useState("");
  const [familyQuery, setFamilyQuery] = useState("");
  const [workset, setWorkset] = useState("All worksets");
  const [selected, setSelected] = useState<number[]>([]);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [pending, setPending] = useState<"prefix" | "category" | "">("");
  const [screen, setScreen] = useState<"main" | "rules" | "rename">("main");
  const [find, setFind] = useState("");
  const [replacement, setReplacement] = useState("");
  const [status, setStatus] = useState("Ready.");
  const [receipt, setReceipt] = useState<string[]>([]);
  const expected = (row: Row) =>
    rules.find(
      (rule) =>
        (rule.prefix || rule.category) &&
        (!rule.prefix || row.family.startsWith(rule.prefix)) &&
        (!rule.category || row.category === rule.category),
    )?.workset ?? "";
  const visible = rows.filter(
    (row) =>
      (!cats.length || cats.includes(row.category)) &&
      (!families.length || families.includes(row.family)) &&
      (workset === "All worksets" || row.current === workset),
  );
  const pendingRows = visible.filter(
    (row) =>
      expected(row) &&
      (pending === "category" || expected(row) !== row.current),
  );
  const edited = visible.filter(
    (row) =>
      selected.includes(row.id) &&
      edits[row.id] &&
      edits[row.id] !== row.current,
  );
  const table = (list: Row[]) =>
    list.map((row) => [
      row.family,
      row.type,
      row.current,
      row.count,
      expected(row),
      row.current === expected(row)
        ? "Compliant"
        : expected(row)
          ? "Non-compliant"
          : "No rule",
      row.category,
    ]);

  function apply(list: Row[], target: (row: Row) => string, message: string) {
    setRows(
      rows.map((row) =>
        list.includes(row) ? { ...row, current: target(row) } : row,
      ),
    );
    setReceipt(
      list.map(
        (row) =>
          row.family +
          ", " +
          row.current +
          " → " +
          target(row) +
          ", " +
          row.count +
          " elements",
      ),
    );
    setEdits({});
    setPending("");
    setStatus(
      message +
        ": " +
        list.reduce((sum, row) => sum + row.count, 0) +
        " sample elements moved.",
    );
    ctx.done("apply");
  }

  function bulk(kind: "prefix" | "category") {
    const list = visible.filter(
      (row) =>
        expected(row) && (kind === "category" || expected(row) !== row.current),
    );
    if (!list.length) {
      setStatus(
        kind === "prefix"
          ? "Nothing to do: no visible row is non-compliant with a BEP rule."
          : "Nothing to do: no visible row has a BEP rule.",
      );
      return;
    }
    setPending(kind);
    ctx.done("configure");
    ctx.done("preview");
  }

  if (screen === "rules")
    return (
      <div className="workset-body">
        <DialogShell
          theme={ctx.theme}
          onTheme={ctx.setTheme}
          title="BEP Workset Rules"
          subtitle="Which workset an element belongs on. Rules are tried top to bottom and the first match wins."
          onClose={() => setScreen("main")}
          footer={
            <>
              <Btn
                onClick={() =>
                  setDraftRules([
                    ...draftRules,
                    { prefix: "", category: "", workset: worksets[0] },
                  ])
                }
              >
                Add rule
              </Btn>
              <Btn
                disabled={ruleRow < 0 || ruleRow >= draftRules.length}
                onClick={() =>
                  setDraftRules(
                    draftRules.map((rule, index) =>
                      index === ruleRow
                        ? { ...rule, prefix: "", category: "", workset: "" }
                        : rule,
                    ),
                  )
                }
              >
                Clear row
              </Btn>
              <Btn onClick={() => configFile.current?.click()}>Load JSON…</Btn>
              <Btn
                onClick={() => {
                  const blob = new Blob(
                    [
                      JSON.stringify(
                        { simulation: true, rules: draftRules },
                        null,
                        2,
                      ),
                    ],
                    { type: "application/json" },
                  );
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = "Sample-BEP-Worksets.json";
                  anchor.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  setConfigStatus("Saved fictional sample rules as JSON.");
                }}
              >
                Save JSON…
              </Btn>
              <span role="status">{configStatus}</span>
              <Btn onClick={() => setScreen("main")}>Cancel</Btn>
              <Btn
                primary
                onClick={() => {
                  setRules(draftRules);
                  setScreen("main");
                  setStatus("BEP rules updated for the sample.");
                  setEdits({});
                }}
              >
                Use these rules
              </Btn>
            </>
          }
        >
          <input
            ref={configFile}
            type="file"
            accept=".json,application/json"
            aria-label="Load sample BEP workset rules"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 100000)
                  throw new Error("Use a JSON file smaller than 100 KB.");
                const value: unknown = JSON.parse(await file.text());
                const candidate = (value as { rules?: unknown }).rules;
                if (
                  !Array.isArray(candidate) ||
                  candidate.length > 100 ||
                  !candidate.every(
                    (rule: Rule) =>
                      typeof rule.prefix === "string" &&
                      typeof rule.category === "string" &&
                      typeof rule.workset === "string" &&
                      (!rule.category || categories.includes(rule.category)) &&
                      (!rule.workset || worksets.includes(rule.workset)),
                  )
                )
                  throw new Error(
                    "The JSON must contain sample prefix, category and workset rules.",
                  );
                setDraftRules(candidate);
                setRuleRow(-1);
                setConfigStatus(
                  "Loaded " + candidate.length + " sample rules.",
                );
              } catch (error) {
                setConfigStatus(
                  error instanceof Error
                    ? error.message
                    : "Could not read this JSON.",
                );
              }
              event.target.value = "";
            }}
          />
          <p className="ad-note">
            A rule with a PREFIX matches when the family name starts with it —
            and, if the rule also names a category, when the category agrees. A
            rule with no prefix matches on category alone. A rule with neither
            never matches, so blank rows are harmless.
          </p>
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Family prefix</th>
                  <th>Category</th>
                  <th>Workset</th>
                </tr>
              </thead>
              <tbody>
                {draftRules.map((rule, index) => (
                  <tr
                    key={index}
                    className={ruleRow === index ? "sel" : undefined}
                    onClick={() => setRuleRow(index)}
                    onFocusCapture={() => setRuleRow(index)}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <TextBox
                        aria-label={"Family prefix " + (index + 1)}
                        value={rule.prefix}
                        onChange={(e) =>
                          setDraftRules(
                            draftRules.map((r, i) =>
                              i === index
                                ? { ...r, prefix: e.target.value }
                                : r,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <Select
                        label={"Rule category " + (index + 1)}
                        value={rule.category}
                        options={["", ...categories]}
                        onChange={(value) =>
                          setDraftRules(
                            draftRules.map((r, i) =>
                              i === index ? { ...r, category: value } : r,
                            ),
                          )
                        }
                      />
                    </td>
                    <td>
                      <Select
                        label={"Rule workset " + (index + 1)}
                        value={rule.workset}
                        options={["", ...worksets]}
                        onChange={(value) =>
                          setDraftRules(
                            draftRules.map((r, i) =>
                              i === index ? { ...r, workset: value } : r,
                            ),
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogShell>
      </div>
    );

  if (screen === "rename")
    return (
      <div className="workset-body">
        <DialogShell
          theme={ctx.theme}
          onTheme={ctx.setTheme}
          title="Rename Families"
          onClose={() => setScreen("main")}
          footer={
            <>
              <Btn onClick={() => setScreen("main")}>Cancel</Btn>
              <Btn
                primary
                disabled={!find}
                onClick={() => {
                  const renamed = visible.filter((row) =>
                    row.family.includes(find),
                  );
                  setRows(
                    rows.map((row) =>
                      renamed.includes(row)
                        ? {
                            ...row,
                            family: row.family.replaceAll(find, replacement),
                          }
                        : row,
                    ),
                  );
                  setReceipt(
                    renamed.map(
                      (row) =>
                        row.family +
                        " → " +
                        row.family.replaceAll(find, replacement),
                    ),
                  );
                  setFamilies([]);
                  setScreen("main");
                  setStatus("Renamed " + renamed.length + " sample families.");
                  ctx.done("apply");
                }}
              >
                Rename
              </Btn>
            </>
          }
        >
          <p className="ad-note">
            Replaces text in loadable family NAMES — not type names, and not the
            elements themselves.
          </p>
          <label className="workset-field">
            Find:
            <TextBox value={find} onChange={(e) => setFind(e.target.value)} />
          </label>
          <label className="workset-field">
            Replace with:
            <TextBox
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
            />
          </label>
        </DialogShell>
      </div>
    );

  return (
    <div className="workset-body">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Workset Manager"
        subtitle={
          worksets.length +
          " user worksets, " +
          rules.length +
          " BEP rules loaded. Fictional workshared model."
        }
        onClose={ctx.close}
        footer={
          <>
            <span className="ad-status workset-status" role="status">
              {status}
            </span>
            <Btn
              onClick={() => {
                setReceipt(
                  visible.map(
                    (row) =>
                      row.current +
                      ", " +
                      row.family +
                      ", " +
                      row.count +
                      " elements",
                  ),
                );
                setStatus("Current visible distribution reviewed.");
              }}
            >
              Review distribution
            </Btn>
            <Btn
              onClick={() => {
                setEdits({});
                setSelected([]);
                setStatus("Current sample worksets refreshed.");
                setReceipt([]);
              }}
            >
              Refresh
            </Btn>
            <Btn
              onClick={() => {
                setDraftRules(rules.map((rule) => ({ ...rule })));
                setScreen("rules");
              }}
            >
              Load BEP Config
            </Btn>
            <Btn onClick={() => setScreen("rename")}>Find &amp; Replace</Btn>
            <Btn
              onClick={() =>
                downloadCsv(
                  "Sample-Residence-Worksets.csv",
                  [
                    "Family Name",
                    "Type Name",
                    "Workset",
                    "Count",
                    "Expected Workset",
                    "Status",
                    "Category",
                  ],
                  table(visible),
                )
              }
            >
              Report
            </Btn>
            <Btn demo="workset-auto" onClick={() => bulk("prefix")}>
              Auto-Assign (Prefix)
            </Btn>
            <Btn onClick={() => bulk("category")}>Auto-Assign (Cat)</Btn>
            <Btn
              primary
              demo="workset-apply"
              onClick={() => {
                if (!selected.length) {
                  setStatus(
                    "Select the rows to apply first — the grid's edits are only applied to selected rows.",
                  );
                  return;
                }
                if (!edited.length) {
                  setStatus("None of the selected rows has a changed workset.");
                  return;
                }
                apply(
                  edited,
                  (row) => edits[row.id],
                  "Applied the grid's edits",
                );
              }}
            >
              Apply Changes
            </Btn>
          </>
        }
      >
        <div className="workset-layout">
          <aside className="ad-card workset-rail">
            <b>Categories</b>
            <SearchBox
              placeholder="Search categories"
              value={catQuery}
              onChange={setCatQuery}
            />
            <Check
              label="Select all categories"
              checked={cats.length === categories.length}
              onChange={(value) => setCats(value ? categories : [])}
            />
            {categories
              .filter((name) =>
                name.toLowerCase().includes(catQuery.toLowerCase()),
              )
              .map((name) => (
                <Check
                  key={name}
                  label={name}
                  checked={cats.includes(name)}
                  onChange={(value) =>
                    setCats(
                      value
                        ? [...cats, name]
                        : cats.filter((item) => item !== name),
                    )
                  }
                />
              ))}
          </aside>
          <aside className="ad-card workset-rail">
            <b>Families</b>
            <SearchBox
              placeholder="Search families"
              value={familyQuery}
              onChange={setFamilyQuery}
            />
            <Check
              label="Select all families"
              checked={families.length === rows.length}
              onChange={(value) =>
                setFamilies(value ? rows.map((row) => row.family) : [])
              }
            />
            {rows
              .filter((row) =>
                row.family.toLowerCase().includes(familyQuery.toLowerCase()),
              )
              .map((row) => (
                <Check
                  key={row.id}
                  label={row.family}
                  checked={families.includes(row.family)}
                  onChange={(value) =>
                    setFamilies(
                      value
                        ? [...families, row.family]
                        : families.filter((item) => item !== row.family),
                    )
                  }
                />
              ))}
            <b>Workset</b>
            <Select
              label="Workset filter"
              value={workset}
              options={["All worksets", ...worksets]}
              onChange={setWorkset}
            />
          </aside>
          <section className="workset-main">
            <div
              className="ad-table-wrap"
              data-demo="workset-table"
              tabIndex={0}
              role="region"
              aria-label="Workset assignment rows"
            >
              <table className="ad-table">
                <thead>
                  <tr>
                    {[
                      "Family Name",
                      "Type Name",
                      "Workset",
                      "Count",
                      "Expected Workset",
                      "Status",
                      "Category",
                    ].map((label) => (
                      <th scope="col" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr
                      key={row.id}
                      tabIndex={0}
                      aria-selected={selected.includes(row.id)}
                      className={selected.includes(row.id) ? "sel" : undefined}
                      onClick={(event) =>
                        setSelected(
                          event.ctrlKey
                            ? selected.includes(row.id)
                              ? selected.filter((id) => id !== row.id)
                              : [...selected, row.id]
                            : [row.id],
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === " " || event.key === "Enter") {
                          event.preventDefault();
                          setSelected(
                            selected.includes(row.id)
                              ? selected.filter((id) => id !== row.id)
                              : [...selected, row.id],
                          );
                        }
                      }}
                    >
                      <td>{row.family}</td>
                      <td>{row.type}</td>
                      <td>
                        <Select
                          label={"Workset for " + row.family}
                          value={edits[row.id] ?? row.current}
                          options={worksets}
                          onChange={(value) => {
                            const targets = selected.includes(row.id)
                              ? selected
                              : [row.id];
                            setSelected(targets);
                            setEdits({
                              ...edits,
                              ...Object.fromEntries(
                                targets.map((id) => [id, value]),
                              ),
                            });
                            ctx.done("preview");
                          }}
                        />
                      </td>
                      <td>{row.count}</td>
                      <td>{expected(row) || "—"}</td>
                      <td>
                        {row.current === expected(row)
                          ? "Compliant"
                          : expected(row)
                            ? "Non-compliant"
                            : "No rule"}
                      </td>
                      <td>{row.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {receipt.length > 0 && (
              <Receipt title="Sample workset readback" entries={receipt} />
            )}
          </section>
        </div>
        <ConfirmGuard
          open={Boolean(pending)}
          theme={ctx.theme}
          onTheme={ctx.setTheme}
          title="Workset Manager"
          instruction=""
          content={
            (pending === "prefix"
              ? "Auto-assign non-compliant rows"
              : "Auto-assign every ruled row") +
            ": " +
            pendingRows.reduce((sum, row) => sum + row.count, 0) +
            " element(s) in " +
            pendingRows.length +
            " row(s) will be moved to their BEP workset. One undoable step. Continue?"
          }
          confirmLabel="OK"
          cancelLabel="Cancel"
          onConfirm={() =>
            apply(
              pendingRows,
              expected,
              pending === "prefix"
                ? "Auto-assigned by BEP rule"
                : "Auto-assigned every ruled row",
            )
          }
          onCancel={() => setPending("")}
        />
      </DialogShell>
    </div>
  );
}
