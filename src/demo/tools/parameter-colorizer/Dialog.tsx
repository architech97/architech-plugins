import { useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, SearchBox, Select } from "../../ui";
import { DialogShell } from "../../kit";
import "./style.css";

const categories = ["Doors", "Walls", "Windows"];
const parameters = ["Comments", "Fire Rating", "Type Mark"];
const colors = ["#8AB8E6", "#79C7B0", "#E4BC72"];
const elements = [
  { id: 348211, category: "Doors", values: ["Internal", "60 min", "D-01"] },
  { id: 348212, category: "Doors", values: ["Internal", "60 min", "D-01"] },
  { id: 348213, category: "Doors", values: ["External", "90 min", "D-02"] },
  { id: 301144, category: "Walls", values: ["Existing", "120 min", "W-01"] },
  { id: 301178, category: "Walls", values: ["New", "60 min", "W-02"] },
  {
    id: 348222,
    category: "Windows",
    values: ["External", "Not rated", "WIN-01"],
  },
];

export default function ParameterColorizer(ctx: DemoContext) {
  const [category, setCategory] = useState(categories[0]);
  const [parameter, setParameter] = useState(parameters[0]);
  const [query, setQuery] = useState("");
  const [keep, setKeep] = useState(false);
  const [overrides, setOverrides] = useState<Record<number, string>>({});
  const [status, setStatus] = useState("");
  const [closed, setClosed] = useState(false);
  const visible = elements.filter((element) => element.category === category);
  const names = [
    ...new Set(
      visible.map((element) => element.values[parameters.indexOf(parameter)]),
    ),
  ].sort();
  const groups = names.map((value, index) => ({
    value,
    count: visible.filter(
      (element) => element.values[parameters.indexOf(parameter)] === value,
    ).length,
    color: colors[index % colors.length],
  }));
  const shown = groups.filter((group) =>
    group.value.toLowerCase().includes(query.toLowerCase()),
  );

  function close() {
    if (!keep) setOverrides({});
    setStatus(
      keep
        ? "Closed with Keep colors when closing enabled. Sample overrides are retained."
        : "Closed and restored the sample original graphic overrides.",
    );
    setClosed(true);
    ctx.notify({
      kind: "info",
      text: keep
        ? "Sample group colors retained."
        : "Sample original overrides restored.",
    });
  }

  if (closed)
    return (
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Parameter Colorizer"
        subtitle="Sample dialog closed"
        onClose={ctx.close}
        footer={
          <>
            <Btn onClick={ctx.close}>Close</Btn>
            <Btn primary onClick={() => setClosed(false)}>
              Reopen sample dialog
            </Btn>
          </>
        }
      >
        <p role="status">{status}</p>
        <p className="ad-note">
          {Object.keys(overrides).length} sample elements retain color
          overrides.
        </p>
      </DialogShell>
    );

  return (
    <div className="colorizer-body">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Parameter Colorizer"
        onClose={close}
        footer={
          <>
            <Check
              label="Keep colors when closing"
              checked={keep}
              onChange={setKeep}
            />
            <Btn
              onClick={() => {
                setStatus(
                  groups.length +
                    " distinct values; " +
                    visible.length +
                    " elements in this view.",
                );
                ctx.done("configure");
              }}
            >
              Refresh grouping
            </Btn>
            <Btn
              demo="colorize-restore"
              onClick={() => {
                setOverrides({});
                setStatus("Original graphic overrides restored.");
                ctx.done("apply");
              }}
            >
              Restore originals
            </Btn>
            <Btn
              primary
              demo="colorize-apply"
              disabled={!groups.length}
              onClick={() => {
                setOverrides({
                  ...overrides,
                  ...Object.fromEntries(
                    visible.map((element) => [
                      element.id,
                      groups.find(
                        (group) =>
                          group.value ===
                          element.values[parameters.indexOf(parameter)],
                      )!.color,
                    ]),
                  ),
                });
                setStatus(
                  "Applied colors to " +
                    visible.length +
                    " elements in this sample view.",
                );
                ctx.done("preview");
              }}
            >
              Apply colors
            </Btn>
          </>
        }
      >
        <div className="colorizer-body">
          <div className="colorizer-fields" data-demo="colorize-fields">
            <label>
              CATEGORY
              <Select
                label="Category"
                value={category}
                options={categories}
                onChange={(value) => {
                  setCategory(value);
                  setParameter(parameters[0]);
                  setStatus("");
                  ctx.rewind("configure");
                  ctx.done("configure");
                }}
              />
            </label>
            <label>
              PARAMETER
              <Select
                label="Parameter"
                value={parameter}
                options={parameters}
                onChange={(value) => {
                  setParameter(value);
                  setStatus("");
                  ctx.rewind("configure");
                  ctx.done("configure");
                }}
              />
            </label>
          </div>
          <SearchBox
            placeholder="Filter values"
            value={query}
            onChange={setQuery}
          />
          <div
            className="ad-table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Parameter value groups"
          >
            <table className="ad-table">
              <thead>
                <tr>
                  <th scope="col">Value</th>
                  <th scope="col">Elements</th>
                  <th scope="col">Color</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((group) => (
                  <tr key={group.value}>
                    <td>{group.value}</td>
                    <td>{group.count}</td>
                    <td>
                      <span
                        aria-label={group.color}
                        style={{
                          display: "block",
                          height: 18,
                          background: group.color,
                          borderRadius: 3,
                        }}
                      />
                    </td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr>
                    <td colSpan={3}>No values match this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p role="status">
            {status ||
              groups.length +
                " distinct values; " +
                visible.length +
                " elements in this view."}
          </p>
          <section
            className="colorizer-swatches"
            aria-label="Sample view appearance"
          >
            {visible.map((element) => (
              <div
                key={element.id}
                className="colorizer-element"
                style={
                  overrides[element.id]
                    ? {
                        borderColor: overrides[element.id],
                        background: overrides[element.id],
                        color: "#14181d",
                      }
                    : undefined
                }
              >
                <p>
                  {element.category} · {element.id}
                </p>
                <small>
                  {overrides[element.id]
                    ? "Group color applied"
                    : "Original overrides"}
                </small>
              </div>
            ))}
          </section>
          <p className="colorizer-note">
            Browser preview · Fictional sample elements in the active view.
          </p>
        </div>
      </DialogShell>
    </div>
  );
}
