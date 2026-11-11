import { useRef, useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, SearchBox, Select, TextBox } from "../../ui";
import { ConfirmGuard, DialogShell, Receipt } from "../../kit";
import { downloadCsv } from "../../demos/craftedTools";
import "./style.css";

interface Family {
  id: number;
  category: string;
  family: string;
  name: string;
  types: number;
}
interface Convention {
  category: string;
  prefix: string;
  suffix: string;
  replacePrefix?: string;
}
const categories = ["Doors", "Windows", "Casework"];
const initialFamilies: Family[] = [
  {
    id: 6501,
    category: "Doors",
    family: "Door_Single",
    name: "Door_Single",
    types: 3,
  },
  {
    id: 6502,
    category: "Windows",
    family: "Window_Fixed",
    name: "Window_Fixed",
    types: 2,
  },
  {
    id: 6503,
    category: "Casework",
    family: "AR-CSW-Base Cabinet",
    name: "AR-CSW-Base Cabinet",
    types: 2,
  },
];
const initialTypes: Family[] = initialFamilies.map((family, index) => ({
  ...family,
  id: family.id + 100,
  name: ["900 × 2100 mm", "1200 × 1500 mm", "600 mm"][index],
}));
const initialRules: Convention[] = categories.map((category, index) => ({
  category,
  prefix: ["AR-DOR-", "AR-WIN-", "AR-CSW-"][index],
  suffix: "",
}));

export default function FamilyNameEditor(ctx: DemoContext) {
  const [mode, setMode] = useState("Families");
  const [families, setFamilies] = useState(initialFamilies);
  const [types, setTypes] = useState(initialTypes);
  const [cats, setCats] = useState(categories);
  const [familyScope, setFamilyScope] = useState<string[]>([]);
  const [catQuery, setCatQuery] = useState("");
  const [familyQuery, setFamilyQuery] = useState("");
  const [nonCompliant, setNonCompliant] = useState(false);
  const [hideCats, setHideCats] = useState(false);
  const [hideFamilies, setHideFamilies] = useState(false);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [expectedEdits, setExpectedEdits] = useState<Record<number, string>>(
    {},
  );
  const [familyRules, setFamilyRules] = useState(initialRules);
  const [typeRules, setTypeRules] = useState(
    initialRules.map((rule) => ({
      ...rule,
      prefix: rule.prefix.replace("AR-", "T-"),
      replacePrefix: "",
    })),
  );
  const [draftRules, setDraftRules] = useState(initialRules);
  const [configSearch, setConfigSearch] = useState("");
  const [configStatus, setConfigStatus] = useState("");
  const configFile = useRef<HTMLInputElement>(null);
  const [screen, setScreen] = useState<"main" | "rules" | "replace">("main");
  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [pending, setPending] = useState<{ row: Family; to: string }[]>([]);
  const [status, setStatus] = useState("Ready.");
  const [receipt, setReceipt] = useState<string[]>([]);
  const data = mode === "Families" ? families : types;
  const rules = mode === "Families" ? familyRules : typeRules;
  const setRules = (next: Convention[]) =>
    mode === "Families"
      ? setFamilyRules(next)
      : setTypeRules(
          next.map((rule) => ({
            ...rule,
            replacePrefix: rule.replacePrefix ?? "",
          })),
        );
  const ruleFor = (row: Family) =>
    rules.find((rule) => rule.category === row.category);
  const isCompliant = (row: Family) => {
    const rule = ruleFor(row);
    return (
      !rule ||
      ((!rule.prefix || row.name.startsWith(rule.prefix)) &&
        (!rule.suffix || row.name.endsWith(rule.suffix)))
    );
  };
  const expectedName = (row: Family) => {
    const rule = ruleFor(row);
    if (!rule) return row.name;
    const current =
      mode === "Types" &&
      rule.replacePrefix &&
      row.name.startsWith(rule.replacePrefix)
        ? row.name.slice(rule.replacePrefix.length)
        : row.name;
    return (
      (current.startsWith(rule.prefix) ? "" : rule.prefix) +
      current +
      (current.endsWith(rule.suffix) ? "" : rule.suffix)
    );
  };
  const statusFor = (row: Family) => {
    const rule = ruleFor(row);
    return !rule || (!rule.prefix && !rule.suffix)
      ? "Unassigned"
      : isCompliant(row)
        ? "Compliant"
        : "Non-compliant";
  };
  const visible = data.filter(
    (row) =>
      (!cats.length || cats.includes(row.category)) &&
      (!familyScope.length || familyScope.includes(row.family)) &&
      (!nonCompliant || statusFor(row) === "Non-compliant"),
  );
  const edited = visible.filter(
    (row) => edits[row.id] !== undefined && edits[row.id] !== row.name,
  );
  const report = () =>
    downloadCsv(
      "Sample-Residence-Family-Names.csv",
      [
        "Category",
        mode === "Families" ? "Family Name" : "New Type Name",
        "Expected Name",
        "Status",
      ],
      visible.map((row) => [
        row.category,
        edits[row.id] ?? row.name,
        expectedEdits[row.id] ?? expectedName(row),
        statusFor(row),
      ]),
    );

  function propose(items: { row: Family; to: string }[]) {
    if (!items.length) {
      setStatus(
        "No name has been edited. Edit the " +
          (mode === "Families" ? "Family Name" : "New Type Name") +
          " column first.",
      );
      return;
    }
    setPending(items);
    ctx.done("configure");
    ctx.done("preview");
  }
  function apply() {
    const names = new Set(data.map((row) => row.name));
    const allowed = pending.filter(
      (item) =>
        item.to.trim() && !names.has(item.to) && Boolean(names.add(item.to)),
    );
    const ids = new Map(allowed.map((item) => [item.row.id, item.to]));
    const updated = data.map((row) =>
      ids.has(row.id) ? { ...row, name: ids.get(row.id)! } : row,
    );
    if (mode === "Families") setFamilies(updated);
    else setTypes(updated);
    setReceipt(
      pending.map((item) =>
        allowed.includes(item)
          ? item.row.name + " → " + item.to
          : item.row.name + " · Skipped · empty or existing target name",
      ),
    );
    setStatus(
      allowed.length +
        " " +
        (mode === "Families" ? "family" : "type") +
        " name(s) changed; " +
        (pending.length - allowed.length) +
        " skipped.",
    );
    setEdits({});
    setPending([]);
    ctx.done("apply");
  }

  if (screen === "rules")
    return (
      <div className="name-editor-body">
        <DialogShell
          theme={ctx.theme}
          onTheme={ctx.setTheme}
          title={
            mode === "Families"
              ? "BEP Family Naming Convention"
              : "BEP Type Naming Convention"
          }
          subtitle={
            mode === "Families"
              ? "The prefix and suffix each category's family names must carry."
              : "Type rules are separate. Replace prefix is optional and explicit (for example SYS-ARC-)."
          }
          onClose={() => setScreen("main")}
          footer={
            <>
              <Btn onClick={() => configFile.current?.click()}>Load JSON…</Btn>
              <Btn
                onClick={() => {
                  const json = {
                    simulation: true,
                    families: mode === "Families" ? draftRules : familyRules,
                    types: mode === "Types" ? draftRules : typeRules,
                  };
                  const url = URL.createObjectURL(
                    new Blob([JSON.stringify(json, null, 2)], {
                      type: "application/json",
                    }),
                  );
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = "Sample-BEP-Naming.json";
                  anchor.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  setConfigStatus("Saved both sample naming scopes.");
                }}
              >
                Save JSON…
              </Btn>
              <Btn
                onClick={() =>
                  setDraftRules(
                    draftRules.map((rule) => ({
                      ...rule,
                      prefix: "",
                      suffix: "",
                      replacePrefix: "",
                    })),
                  )
                }
              >
                Reset all
              </Btn>
              <span role="status">{configStatus}</span>
              <Btn onClick={() => setScreen("main")}>Cancel</Btn>
              <Btn
                primary
                onClick={() => {
                  setRules(draftRules);
                  setScreen("main");
                  setStatus("Sample naming convention loaded.");
                }}
              >
                Use this convention
              </Btn>
            </>
          }
        >
          <input
            ref={configFile}
            type="file"
            hidden
            accept=".json,application/json"
            aria-label="Load sample BEP naming convention"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 100000)
                  throw new Error("Use a JSON file smaller than 100 KB.");
                const value = JSON.parse(await file.text()) as {
                  families?: Convention[];
                  types?: Convention[];
                };
                const valid = (items: Convention[]) =>
                  Array.isArray(items) &&
                  items.length <= 100 &&
                  items.every(
                    (rule) =>
                      typeof rule.category === "string" &&
                      typeof rule.prefix === "string" &&
                      typeof rule.suffix === "string" &&
                      (rule.replacePrefix === undefined ||
                        typeof rule.replacePrefix === "string"),
                  );
                const candidate =
                  mode === "Families" ? value.families : value.types;
                if (candidate && !valid(candidate))
                  throw new Error("The naming rules are not valid.");
                if (!candidate)
                  throw new Error(
                    "This JSON has no rules for the current naming scope. The existing scope was preserved.",
                  );
                setDraftRules(candidate);
                setConfigStatus(
                  "Loaded the sample " + mode.toLowerCase() + " convention.",
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
            A category with neither a prefix nor a suffix is unregulated — its
            families read Unassigned rather than non-compliant. Categories the
            model does not contain are listed too, because a convention is
            written before the model is built.
          </p>
          <SearchBox
            placeholder="Search categories..."
            value={configSearch}
            onChange={setConfigSearch}
          />
          <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Prefix</th>
                  <th>Suffix</th>
                  {mode === "Types" && <th>Replace prefix</th>}
                  <th>In model</th>
                </tr>
              </thead>
              <tbody>
                {draftRules
                  .map((rule, index) => ({ rule, index }))
                  .filter(({ rule }) =>
                    rule.category
                      .toLowerCase()
                      .includes(configSearch.toLowerCase()),
                  )
                  .map(({ rule, index }) => (
                    <tr key={rule.category}>
                      <td>{rule.category}</td>
                      <td>
                        <TextBox
                          aria-label={rule.category + " prefix"}
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
                        <TextBox
                          aria-label={rule.category + " suffix"}
                          value={rule.suffix}
                          onChange={(e) =>
                            setDraftRules(
                              draftRules.map((r, i) =>
                                i === index
                                  ? { ...r, suffix: e.target.value }
                                  : r,
                              ),
                            )
                          }
                        />
                      </td>
                      {mode === "Types" && (
                        <td>
                          <TextBox
                            aria-label={rule.category + " replace prefix"}
                            value={rule.replacePrefix ?? ""}
                            onChange={(event) =>
                              setDraftRules(
                                draftRules.map((item, id) =>
                                  id === index
                                    ? {
                                        ...item,
                                        replacePrefix: event.target.value,
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                        </td>
                      )}
                      <td>
                        {categories.includes(rule.category) ? "Yes" : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </DialogShell>
      </div>
    );

  if (screen === "replace")
    return (
      <div className="name-editor-body">
        <DialogShell
          theme={ctx.theme}
          onTheme={ctx.setTheme}
          title={mode === "Families" ? "Rename Families" : "Rename Types"}
          onClose={() => setScreen("main")}
          footer={
            <>
              <Btn onClick={() => setScreen("main")}>Cancel</Btn>
              <Btn
                primary
                disabled={!find}
                onClick={() => {
                  setScreen("main");
                  propose(
                    visible
                      .filter((row) => row.name.includes(find))
                      .map((row) => ({
                        row,
                        to: row.name.replaceAll(find, replace),
                      })),
                  );
                }}
              >
                Rename
              </Btn>
            </>
          }
        >
          <label className="name-editor-fields">
            Find:
            <TextBox value={find} onChange={(e) => setFind(e.target.value)} />
          </label>
          <label className="name-editor-fields">
            Replace with:
            <TextBox
              value={replace}
              onChange={(e) => setReplace(e.target.value)}
            />
          </label>
        </DialogShell>
      </div>
    );

  return (
    <div className="name-editor-body">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Family Name Editor"
        subtitle="Fictional Sample Residence · Naming convention review"
        onClose={ctx.close}
        footer={
          <>
            <span className="ad-status" role="status">
              {status}
            </span>
            <Btn
              onClick={() => {
                setEdits({});
                setExpectedEdits({});
                setReceipt([]);
                setStatus("Current names refreshed. Pending edits cleared.");
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
              BEP Config
            </Btn>
            <Btn onClick={() => setScreen("replace")}>Find &amp; Replace</Btn>
            <Btn onClick={report}>Report</Btn>
            <Btn onClick={report}>Export</Btn>
            <Btn
              onClick={() => {
                setNonCompliant(true);
                propose(
                  visible
                    .filter((row) => statusFor(row) === "Non-compliant")
                    .map((row) => ({ row, to: expectedName(row) })),
                );
              }}
            >
              Auto-Assign
            </Btn>
            <Btn
              primary
              demo="naming-apply"
              disabled={!edited.length}
              onClick={() =>
                propose(edited.map((row) => ({ row, to: edits[row.id] })))
              }
            >
              Apply Changes
            </Btn>
          </>
        }
      >
        <div className="name-editor-layout">
          <aside className="ad-card name-editor-rail">
            <b>CATEGORIES</b>
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
            <Check
              label="Hide unselected categories"
              checked={hideCats}
              onChange={setHideCats}
            />
            {categories
              .filter(
                (name) =>
                  (!hideCats || cats.includes(name)) &&
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
          <aside className="ad-card name-editor-rail">
            <b>FAMILIES</b>
            <SearchBox
              placeholder="Search families"
              value={familyQuery}
              onChange={setFamilyQuery}
            />
            <Check
              label="Select all families"
              checked={familyScope.length === families.length}
              onChange={(value) =>
                setFamilyScope(value ? families.map((row) => row.family) : [])
              }
            />
            <Check
              label="Hide unselected families"
              checked={hideFamilies}
              onChange={setHideFamilies}
            />
            {families
              .filter(
                (row) =>
                  (!hideFamilies || familyScope.includes(row.family)) &&
                  row.family.toLowerCase().includes(familyQuery.toLowerCase()),
              )
              .map((row) => (
                <Check
                  key={row.id}
                  label={row.family}
                  checked={familyScope.includes(row.family)}
                  onChange={(value) =>
                    setFamilyScope(
                      value
                        ? [...familyScope, row.family]
                        : familyScope.filter((item) => item !== row.family),
                    )
                  }
                />
              ))}
            <b>BEP CONFIG</b>
            <Check
              label="Non-compliant only"
              checked={nonCompliant}
              onChange={setNonCompliant}
            />
          </aside>
          <section className="name-editor-main">
            <label className="name-editor-fields" data-demo="naming-scope">
              Names to review
              <Select
                label="Names to review"
                value={mode}
                options={["Families", "Types"]}
                onChange={(value) => {
                  setMode(value);
                  setEdits({});
                  setReceipt([]);
                  ctx.rewind("configure");
                  ctx.done("configure");
                }}
              />
            </label>
            <div
              className="ad-table-wrap"
              data-demo="naming-table"
              tabIndex={0}
              role="region"
              aria-label="Naming convention rows"
            >
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    {mode === "Types" && (
                      <>
                        <th>Family</th>
                        <th>Current Type</th>
                      </>
                    )}
                    <th>
                      {mode === "Families" ? "Family Name" : "New Type Name"}
                    </th>
                    <th>{mode === "Families" ? "Types" : "Type ID"}</th>
                    <th>Expected Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => (
                    <tr key={row.id}>
                      <td>{row.category}</td>
                      {mode === "Types" && (
                        <>
                          <td>{row.family}</td>
                          <td>{row.name}</td>
                        </>
                      )}
                      <td>
                        <TextBox
                          aria-label={"Proposed name for " + row.id}
                          value={edits[row.id] ?? row.name}
                          onChange={(e) => {
                            setEdits({ ...edits, [row.id]: e.target.value });
                            ctx.done("preview");
                          }}
                        />
                      </td>
                      <td>{mode === "Families" ? row.types : row.id}</td>
                      <td>
                        <TextBox
                          aria-label={"Expected name for " + row.id}
                          value={expectedEdits[row.id] ?? expectedName(row)}
                          onChange={(e) =>
                            setExpectedEdits({
                              ...expectedEdits,
                              [row.id]: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td>{statusFor(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {receipt.length > 0 && (
              <Receipt title="Sample naming readback" entries={receipt} />
            )}
            <p className="name-editor-note">
              Fictional sample data. Apply uses edited names in the visible
              scope. Auto-Assign uses the loaded rule.
            </p>
          </section>
        </div>
        <ConfirmGuard
          open={pending.length > 0}
          theme={ctx.theme}
          onTheme={ctx.setTheme}
          title="Confirm naming changes"
          instruction=""
          content={
            "Rename " +
            pending.length +
            " " +
            (mode === "Families" ? "families" : "types") +
            " in the visible scope?\n" +
            pending
              .map(
                (item) =>
                  "[" + item.row.id + "] " + item.row.name + "  →  " + item.to,
              )
              .join("\n") +
            "\n\nExisting targets and unavailable elements are skipped. One undoable step."
          }
          confirmLabel="Yes"
          cancelLabel="No"
          onConfirm={apply}
          onCancel={() => setPending([])}
        />
      </DialogShell>
    </div>
  );
}
