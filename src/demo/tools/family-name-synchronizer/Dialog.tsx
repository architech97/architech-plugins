import { useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, Radio, SearchBox, Select, Tabs } from "../../ui";
import { ConfirmGuard, DialogShell, Receipt, TaskDialogShell } from "../../kit";
import { downloadCsv } from "../../demos/craftedTools";
import "./style.css";

const sourceChoices = [
  "Compare with reference model (.rvt)",
  "Compare with mapping file (.csv)",
  "Export this model's mapping file",
];
const tabs = [
  "Mapped families",
  "No Type Mark (project)",
  "No Type Mark (container)",
] as const;
const categories = [
  "All categories",
  "Doors",
  "Windows",
  "Casework",
  "Structural Columns",
];
interface Pair {
  id: number;
  mark: string;
  current: string;
  proposed: string;
  category: string;
  by: string;
}
const initial: Pair[] = [
  {
    id: 8301,
    mark: "D-01",
    current: "Door_Single",
    proposed: "AR-DOR-Single Flush",
    category: "Doors",
    by: "Type Mark",
  },
  {
    id: 8302,
    mark: "W-01",
    current: "Window_Fixed",
    proposed: "AR-WIN-Fixed",
    category: "Windows",
    by: "Type Mark",
  },
  {
    id: 8303,
    mark: "[CW-01]",
    current: "AR-CSW-Base Cabinet",
    proposed: "AR-CSW-Base Cabinet",
    category: "Casework",
    by: "Name suffix",
  },
];
const unmatched = [
  [{ category: "Structural Columns", name: "Rectangular_Column" }],
  [{ category: "Casework", name: "Wall Cabinet – Unmarked" }],
];

export default function FamilyNameSync(ctx: DemoContext) {
  const [stage, setStage] = useState<"launch" | "file" | "results">("launch");
  const [source, setSource] = useState<"model" | "mapping">("model");
  const [file, setFile] = useState("Sample Family Container.rvt");
  const [pairs, setPairs] = useState(initial);
  const [tab, setTab] = useState<(typeof tabs)[number]>(tabs[0]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [ticked, setTicked] = useState<number[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [receipt, setReceipt] = useState<string[]>([]);
  const visible = pairs.filter(
    (pair) =>
      (category === categories[0] || pair.category === category) &&
      [pair.current, pair.proposed, pair.mark]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = visible.filter(
    (pair) => ticked.includes(pair.id) && pair.current !== pair.proposed,
  );
  const other = unmatched[tab === tabs[1] ? 0 : 1].filter(
    (row) =>
      (category === categories[0] || row.category === category) &&
      row.name.toLowerCase().includes(query.toLowerCase()),
  );

  function choose(index: number) {
    if (index === 2) {
      downloadCsv(
        "Sample-Residence-Family-Mapping.csv",
        ["Category", "Type Mark", "Family Name"],
        pairs.map((pair) => [pair.category, pair.mark, pair.current]),
      );
      setStatus(
        "Exported 3 fictional family mapping rows to Sample-Residence-Family-Mapping.csv.",
      );
      ctx.done("configure");
      return;
    }
    setSource(index === 0 ? "model" : "mapping");
    setFile(
      index === 0 ? "Sample Family Container.rvt" : "Sample Family Mapping.csv",
    );
    setStatus("");
    setStage("file");
    ctx.done("configure");
  }

  function open() {
    if (file === "Sample Residence – Architecture.rvt") {
      setStatus(
        "That is the model you are working in. Pick the container file to compare it with.",
      );
      return;
    }
    setStage("results");
    setStatus("");
    ctx.done("preview");
  }

  function rename() {
    const chosen = new Set(selected.map((pair) => pair.id));
    setReceipt(
      selected.map(
        (pair) =>
          pair.current +
          " → " +
          pair.proposed +
          ", every sample instance follows its family",
      ),
    );
    setPairs(
      pairs.map((pair) =>
        chosen.has(pair.id) ? { ...pair, current: pair.proposed } : pair,
      ),
    );
    setTicked(ticked.filter((id) => !chosen.has(id)));
    setPending(false);
    setStatus(selected.length + " family(ies) renamed.");
    ctx.done("apply");
    ctx.notify({
      kind: "success",
      text: selected.length + " sample family names updated.",
    });
  }

  if (stage === "launch")
    return (
      <div className="family-sync-body">
        <TaskDialogShell
          theme={ctx.theme}
          onTheme={ctx.setTheme}
          title="Family Name Sync"
          instruction={
            "Rename this model's families to match a reference. Compare with the reference model itself, or with a mapping file exported from it earlier.\n\nRun Export in the reference model to create that file."
          }
          onClose={ctx.close}
          footer={
            <div className="dk-task-buttons stacked" data-demo="sync-source">
              {sourceChoices.map((label, index) => (
                <Btn key={label} onClick={() => choose(index)}>
                  {label}
                </Btn>
              ))}
              <Btn onClick={ctx.close}>Close</Btn>
            </div>
          }
        >
          {status && <p role="status">{status}</p>}
          <p className="family-sync-note">
            Browser simulation, Sample Residence mapping data is fictional.
          </p>
        </TaskDialogShell>
      </div>
    );

  if (stage === "file")
    return (
      <div className="family-sync-body">
        <DialogShell
          theme={ctx.theme}
          onTheme={ctx.setTheme}
          title={
            source === "model"
              ? "Select the Revit container file"
              : "Select the family name mapping file"
          }
          subtitle="Fictional sample file picker"
          onClose={ctx.close}
          footer={
            <>
              <span className="ad-status" role="status">
                {status || "Choose a fictional reference file."}
              </span>
              <Btn onClick={ctx.close}>Cancel</Btn>
              <Btn primary onClick={open}>
                Open
              </Btn>
            </>
          }
        >
          <div className="family-sync-source">
            {(source === "model"
              ? [
                  "Sample Family Container.rvt",
                  "Sample Residence – Architecture.rvt",
                ]
              : ["Sample Family Mapping.csv"]
            ).map((name) => (
              <Radio
                key={name}
                name="family-sync-file"
                label={name}
                checked={name === file}
                onChange={() => {
                  setFile(name);
                  setStatus("");
                }}
              />
            ))}
            <p className="family-sync-note">
              The sample picker loads a prepared browser fixture. The desktop
              command opens the reference read-only for comparison.
            </p>
          </div>
        </DialogShell>
      </div>
    );

  return (
    <div className="family-sync-body">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Family Name Sync"
        subtitle={"Container: " + file}
        onClose={ctx.close}
        footer={
          <>
            <span className="ad-status family-sync-status" role="status">
              {status ||
                pairs.length +
                  " mapped, " +
                  pairs.filter((pair) => pair.current === pair.proposed)
                    .length +
                  " already match, " +
                  selected.length +
                  " ticked to rename, showing " +
                  visible.length}
            </span>
            <Btn
              onClick={() =>
                downloadCsv(
                  "Sample-Residence-Family-Name-Report.csv",
                  [
                    "Match",
                    "Matched by",
                    "Category",
                    "Current name",
                    "Container name",
                    "Match?",
                  ],
                  pairs.map((pair) => [
                    pair.mark,
                    pair.by,
                    pair.category,
                    pair.current,
                    pair.proposed,
                    pair.current === pair.proposed ? "Yes" : "No",
                  ]),
                )
              }
            >
              Report
            </Btn>
            <Btn onClick={ctx.close}>Close</Btn>
            <Btn
              primary
              demo="sync-rename"
              disabled={!selected.length}
              onClick={() => setPending(true)}
            >
              Rename
            </Btn>
          </>
        }
      >
        <div className="family-sync-body">
          <div className="ad-row">
            <SearchBox
              placeholder="Search families or Type Marks"
              value={query}
              onChange={setQuery}
            />
            <Select
              label="Filter by category"
              value={category}
              options={categories}
              onChange={setCategory}
            />
            <Btn
              onClick={() => {
                setTicked([
                  ...new Set([...ticked, ...visible.map((pair) => pair.id)]),
                ]);
                ctx.done("preview");
              }}
            >
              Select all
            </Btn>
            <Btn
              onClick={() =>
                setTicked(
                  ticked.filter(
                    (id) => !visible.some((pair) => pair.id === id),
                  ),
                )
              }
            >
              Select none
            </Btn>
          </div>
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          <div
            className="ad-table-wrap"
            data-demo="sync-families"
            tabIndex={0}
            role="region"
            aria-label="Family name comparison"
          >
            {tab === tabs[0] ? (
              <table className="ad-table">
                <thead>
                  <tr>
                    {[
                      "Rename?",
                      "Match",
                      "Matched by",
                      "Category",
                      "Current name",
                      "Container name",
                      "Match?",
                    ].map((label) => (
                      <th key={label} scope="col">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((pair) => (
                    <tr key={pair.id}>
                      <td>
                        <Check
                          title={"Rename " + pair.current}
                          checked={ticked.includes(pair.id)}
                          onChange={(value) => {
                            setTicked(
                              value
                                ? [...ticked, pair.id]
                                : ticked.filter((id) => id !== pair.id),
                            );
                            ctx.done("preview");
                          }}
                        />
                      </td>
                      <td>{pair.mark}</td>
                      <td>{pair.by}</td>
                      <td>{pair.category}</td>
                      <td className="family-sync-name">{pair.current}</td>
                      <td className="family-sync-name">{pair.proposed}</td>
                      <td>{pair.current === pair.proposed ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                  {!visible.length && (
                    <tr>
                      <td colSpan={7}>
                        No mapped family matches the current search or category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="ad-table">
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    <th scope="col">Family</th>
                  </tr>
                </thead>
                <tbody>
                  {other.map((row) => (
                    <tr key={row.name}>
                      <td>{row.category}</td>
                      <td>{row.name}</td>
                    </tr>
                  ))}
                  {!other.length && (
                    <tr>
                      <td colSpan={2}>
                        No unmatched families match the current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
          {receipt.length > 0 && (
            <Receipt title="Sample family-name readback" entries={receipt} />
          )}
          <p className="family-sync-note">
            Fictional sample data. Rename applies only to ticked non-compliant
            mapped families visible through the current filter.
          </p>
        </div>
      </DialogShell>
      <ConfirmGuard
        open={pending}
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Family Name Sync"
        instruction=""
        content={
          "Rename " +
          selected.length +
          " family(ies)?\n\nRenaming a family affects every instance of it in the project. This is one undoable step."
        }
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={rename}
        onCancel={() => setPending(false)}
      />
    </div>
  );
}
