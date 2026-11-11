import { useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, SearchBox } from "../../ui";
import { DialogShell, Receipt } from "../../kit";
import { downloadCsv } from "../../demos/craftedTools";
import "./style.css";

const hosts = [
  {
    id: 101,
    name: "Level 01 – Floor Plan",
    type: "Floor Plan",
    template: false,
  },
  {
    id: 102,
    name: "Level 02 – Floor Plan",
    type: "Floor Plan",
    template: false,
  },
  { id: 201, name: "North Elevation", type: "Elevation", template: false },
  { id: 301, name: "Coordination 3D", type: "3D View", template: false },
  {
    id: 501,
    name: "Architectural Plan – 1:50",
    type: "Floor Plan",
    template: true,
  },
  { id: 502, name: "Exterior Elevation", type: "Elevation", template: true },
];
const filters = [
  "QA – Fire Rated Doors",
  "MEP – Linked Coordination",
  "ARCH – Unclassified Walls",
];
const viewTypes = ["Floor Plan", "Elevation", "3D View"];
const initial: Record<string, number[]> = {
  [filters[0]]: [101, 102, 501],
  [filters[1]]: [301],
  [filters[2]]: [],
};

export default function FilterUsageChecker(ctx: DemoContext) {
  const [usage, setUsage] = useState(initial);
  const [types, setTypes] = useState(viewTypes);
  const [checkedFilters, setCheckedFilters] = useState<string[]>([]);
  const [hide, setHide] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [proposed, setProposed] = useState<number[]>([]);
  const [status, setStatus] = useState("3 filters in the sample project.");
  const [receipt, setReceipt] = useState<string[]>([]);
  const shownFilters = filters.filter(
    (name) =>
      (!hide || checkedFilters.includes(name)) &&
      name.toLowerCase().includes(query.toLowerCase()),
  );
  const summaryFilters = checkedFilters.length
    ? checkedFilters
    : filters.filter((name) =>
        name.toLowerCase().includes(query.toLowerCase()),
      );
  const allowed = hosts.filter(
    (host) => !types.length || types.includes(host.type),
  );
  const current = usage[selected] ?? [];
  const added = allowed.filter(
    (host) => proposed.includes(host.id) && !current.includes(host.id),
  );
  const removed = allowed.filter(
    (host) => !proposed.includes(host.id) && current.includes(host.id),
  );
  const changes = added.length + removed.length;

  function choose(name: string) {
    setSelected(name);
    setProposed(usage[name]);
    setReceipt([]);
    setStatus("");
    ctx.done("configure");
  }

  function changeTypes(next: string[]) {
    setTypes(next);
    setSelected("");
    setProposed([]);
    setStatus("View-type scope changed. Select a filter again.");
    ctx.rewind("configure");
  }

  function report() {
    downloadCsv(
      "Sample-Residence-Filter-Usage.csv",
      ["Filter", "Views + templates", "Views", "Templates"],
      filters.map((name) => [
        name,
        usage[name].length,
        hosts.filter((host) => !host.template && usage[name].includes(host.id))
          .length,
        hosts.filter((host) => host.template && usage[name].includes(host.id))
          .length,
      ]),
    );
  }

  return (
    <div className="filter-usage-body">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Filter Usage Checker"
        subtitle="3 filters and 6 filter-hosting views and templates in this fictional project."
        onClose={ctx.close}
        footer={
          <>
            <span className="ad-status" role="status">
              {status ||
                (changes
                  ? added.length +
                    " add(s) · " +
                    removed.length +
                    " removal(s) pending"
                  : "No pending changes.")}
            </span>
            <Btn
              onClick={() => {
                setSelected("");
                setProposed([]);
                setReceipt([]);
                setStatus(
                  "Filter usage refreshed. Pending ticks were discarded.",
                );
                ctx.rewind("configure");
              }}
            >
              Refresh
            </Btn>
            <Btn onClick={report}>Report</Btn>
            <Btn onClick={report}>Export…</Btn>
            <Btn
              primary
              demo="filter-apply"
              disabled={!selected || !changes}
              onClick={() => {
                const next = [
                  ...new Set([
                    ...current.filter(
                      (id) => !removed.some((host) => host.id === id),
                    ),
                    ...added.map((host) => host.id),
                  ]),
                ];
                setUsage({ ...usage, [selected]: next });
                setProposed(next);
                setStatus(
                  "Applied " + changes + ' change(s) to "' + selected + '".',
                );
                setReceipt([
                  ...added.map((host) => "Added to " + host.name),
                  ...removed.map((host) => "Removed from " + host.name),
                ]);
                ctx.done("apply");
              }}
            >
              Apply Changes
            </Btn>
            <Btn onClick={ctx.close}>Close</Btn>
          </>
        }
      >
        <div className="filter-layout">
          <aside className="ad-card filter-rail">
            <b className="ad-label">VIEW TYPES</b>
            <Check
              label="Select all view types"
              checked={types.length === viewTypes.length}
              onChange={(value) => changeTypes(value ? viewTypes : [])}
            />
            {viewTypes.map((type) => (
              <Check
                key={type}
                label={type}
                checked={types.includes(type)}
                onChange={(value) =>
                  changeTypes(
                    value
                      ? [...types, type]
                      : types.filter((item) => item !== type),
                  )
                }
              />
            ))}
          </aside>
          <aside className="ad-card filter-rail">
            <b className="ad-label">FILTERS</b>
            <SearchBox
              placeholder="Filter names..."
              value={query}
              onChange={setQuery}
            />
            <Check
              label="Select all filters"
              checked={checkedFilters.length === filters.length}
              onChange={(value) => setCheckedFilters(value ? filters : [])}
            />
            <Check label="Hide unselected" checked={hide} onChange={setHide} />
            {shownFilters.map((name) => (
              <Check
                key={name}
                label={name}
                checked={checkedFilters.includes(name)}
                onChange={(value) =>
                  setCheckedFilters(
                    value
                      ? [...checkedFilters, name]
                      : checkedFilters.filter((item) => item !== name),
                  )
                }
              />
            ))}
          </aside>
          <div className="filter-detail">
            <div
              className="ad-table-wrap"
              data-demo="filter-summary"
              tabIndex={0}
              role="region"
              aria-label="Filter usage totals"
            >
              <table className="ad-table">
                <thead>
                  <tr>
                    {["Filter", "Views + templates", "Views", "Templates"].map(
                      (label) => (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {summaryFilters.map((name) => {
                    const targets = allowed.filter((host) =>
                      usage[name].includes(host.id),
                    );
                    return (
                      <tr
                        key={name}
                        className={selected === name ? "sel" : undefined}
                        onClick={() => choose(name)}
                      >
                        <td>
                          <button className="filter-row-button">{name}</button>
                        </td>
                        <td>{targets.length}</td>
                        <td>
                          {targets.filter((host) => !host.template).length}
                        </td>
                        <td>
                          {targets.filter((host) => host.template).length}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <section
              className="filter-detail"
              data-demo="filter-targets"
              aria-label="Filter placement edits"
            >
              <section className="ad-card">
                <b>
                  {selected ? selected.toUpperCase() : "NO FILTER SELECTED"}
                </b>
                <p className="ad-note">
                  Click a filter in the grid to see every view and template it
                  can go on. Tick to add, untick to remove.
                </p>
              </section>
              {
                <div className="filter-targets">
                  {[false, true].map((template) => (
                    <section className="ad-card" key={String(template)}>
                      <b className="ad-label">
                        {template ? "VIEW TEMPLATES" : "VIEWS"}
                      </b>
                      {!selected && (
                        <p className="ad-note">
                          {template
                            ? "Pick a filter in the grid to list the view templates it can go on."
                            : "Pick a filter in the grid to list the views it can go on."}
                        </p>
                      )}
                      {selected &&
                        allowed
                          .filter((host) => host.template === template)
                          .map((host) => (
                            <Check
                              key={host.id}
                              label={host.name + " [" + host.type + "]"}
                              checked={proposed.includes(host.id)}
                              onChange={(value) => {
                                setProposed(
                                  value
                                    ? [...proposed, host.id]
                                    : proposed.filter((id) => id !== host.id),
                                );
                                setStatus("");
                                ctx.done("preview");
                              }}
                            />
                          ))}
                    </section>
                  ))}
                </div>
              }
            </section>
            {receipt.length > 0 && (
              <Receipt title="Sample filter-usage readback" entries={receipt} />
            )}
          </div>
        </div>
      </DialogShell>
    </div>
  );
}
