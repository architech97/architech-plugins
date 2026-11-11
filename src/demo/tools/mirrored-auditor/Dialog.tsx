import { useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, SearchBox } from "../../ui";
import { ConfirmGuard, DialogShell, Receipt } from "../../kit";
import { downloadCsv } from "../../demos/craftedTools";
import "./style.css";

interface Instance {
  id: number;
  category: string;
  family: string;
  type: string;
  level: string;
  mirrored: boolean;
  hand: boolean;
  facing: boolean;
  position: string;
  protected?: boolean;
}
const initial: Instance[] = [
  {
    id: 348211,
    category: "Doors",
    family: "Single Flush",
    type: "900 × 2100 mm",
    level: "Level 01",
    mirrored: true,
    hand: false,
    facing: false,
    position: "(3.4, 6.2, 0.0) m",
  },
  {
    id: 348222,
    category: "Windows",
    family: "Fixed Window",
    type: "1200 × 1500 mm",
    level: "Level 01",
    mirrored: false,
    hand: true,
    facing: false,
    position: "(6.1, 2.4, 0.9) m",
  },
  {
    id: 348233,
    category: "Mechanical Equipment",
    family: "Mechanical Cabinet",
    type: "Utility cabinet",
    level: "Level 02",
    mirrored: true,
    hand: false,
    facing: false,
    position: "(2.1, 3.8, 3.0) m",
    protected: true,
  },
];
const columns = [
  "ID",
  "Category",
  "Family",
  "Type",
  "Level",
  "Mirror Status",
  "Hand Flipped",
  "Facing Flipped",
];
const cells = (row: Instance) => [
  String(row.id),
  row.category,
  row.family,
  row.type,
  row.level,
  row.mirrored ? "MIRROR WARNING" : "VALID FLIP",
  row.hand ? "Yes" : "No",
  row.facing ? "Yes" : "No",
];

export default function MirroredAuditor(ctx: DemoContext) {
  const [instances, setInstances] = useState(initial);
  const [onlyMirrored, setOnlyMirrored] = useState(false);
  const [query, setQuery] = useState("");
  const [ticked, setTicked] = useState<number[]>([]);
  const [active, setActive] = useState<number>();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState(
    "Audited 3 elements: 2 mirrored warnings identified.",
  );
  const [receipt, setReceipt] = useState<string[]>([]);
  const rows = instances.filter(
    (row) =>
      (row.mirrored || row.hand || row.facing) &&
      (!onlyMirrored || row.mirrored) &&
      [row.family, row.type, row.level]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = instances.filter(
    (row) => ticked.includes(row.id) && row.mirrored,
  );
  const activeRow = instances.find((row) => row.id === active);
  const mirrored = instances.filter((row) => row.mirrored).length;

  function resolve() {
    const changed = selected.filter((row) => !row.protected);
    const failures = selected.filter((row) => row.protected);
    setInstances(
      instances.map((row) =>
        changed.includes(row) ? { ...row, mirrored: false } : row,
      ),
    );
    setReceipt(
      selected.map((row) =>
        changed.includes(row)
          ? row.id +
            " · mirror state corrected · position " +
            row.position +
            ", type, host, hand and swing retained"
          : row.id +
            " · unchanged · host or orientation could not be preserved",
      ),
    );
    setStatus(
      "Verified " +
        changed.length +
        " mirror-state corrections. " +
        failures.length +
        " unchanged.\n" +
        failures
          .map(
            (row) =>
              row.id +
              ": instance cannot preserve its host and orientation; unchanged.",
          )
          .join("\n"),
    );
    setTicked([]);
    setActive(undefined);
    setPending(false);
    ctx.done("apply");
    ctx.notify({
      kind: failures.length ? "warning" : "success",
      text:
        changed.length +
        " sample corrections and " +
        failures.length +
        " unchanged.",
    });
  }

  return (
    <div className="mirror-body">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Mirrored Auditor"
        subtitle="Mirrored doors, windows and specialty equipment, apart from valid hand and facing flips"
        onClose={ctx.close}
        footer={
          <>
            <span className="ad-status mirror-status" role="status">
              {status}
            </span>
            <Btn
              disabled={!activeRow}
              onClick={() => {
                if (activeRow)
                  setStatus(
                    "Isolated " +
                      activeRow.family +
                      " [" +
                      activeRow.id +
                      "] in ArchiTECH 3D.",
                  );
              }}
            >
              Show in 3D
            </Btn>
            <Btn
              disabled={!ticked.length && !activeRow}
              onClick={() =>
                setStatus(
                  "Isolated " +
                    (ticked.length || 1) +
                    " elements in ArchiTECH 3D.",
                )
              }
            >
              Isolate in view
            </Btn>
            <Btn
              onClick={() =>
                downloadCsv(
                  "Sample-Residence-Mirrored-Auditor.csv",
                  columns,
                  instances
                    .filter((row) => row.mirrored || row.hand || row.facing)
                    .map(cells),
                )
              }
            >
              Export report
            </Btn>
            <Btn
              primary
              demo="mirror-resolve"
              disabled={!selected.length}
              onClick={() => setPending(true)}
            >
              Resolve selected
            </Btn>
            <Btn onClick={ctx.close}>Close</Btn>
          </>
        }
      >
        <div className="mirror-body">
          <div className="ad-row" data-demo="mirror-options">
            <span>
              {instances.length} audited ·{" "}
              {
                instances.filter(
                  (row) => !row.mirrored && (row.hand || row.facing),
                ).length
              }{" "}
              valid flips · {mirrored} mirrored
            </span>
            <SearchBox
              placeholder="Filter by family, type or level"
              value={query}
              onChange={setQuery}
            />
            <Check
              label="Mirrored only"
              checked={onlyMirrored}
              onChange={setOnlyMirrored}
            />
            <Btn
              onClick={() => {
                setTicked([
                  ...new Set([
                    ...ticked,
                    ...rows.filter((row) => row.mirrored).map((row) => row.id),
                  ]),
                ]);
                ctx.done("configure");
                ctx.done("preview");
              }}
            >
              Tick all mirrored
            </Btn>
            <Btn
              onClick={() => {
                setTicked([]);
                setActive(undefined);
                setReceipt([]);
                setStatus(
                  "Audited " +
                    instances.length +
                    " elements: " +
                    mirrored +
                    " mirrored warnings identified.",
                );
                ctx.rewind("preview");
              }}
            >
              Re-scan
            </Btn>
          </div>
          <div
            className="ad-table-wrap mirror-grid"
            data-demo="mirror-table"
            tabIndex={0}
            role="region"
            aria-label="Mirror audit results"
          >
            <table className="ad-table">
              <thead>
                <tr>
                  <th scope="col">Select</th>
                  {columns.map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    className={active === row.id ? "sel" : undefined}
                    aria-selected={active === row.id}
                    onClick={() => {
                      setActive(row.id);
                      ctx.done("configure");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setActive(row.id);
                        ctx.done("configure");
                      }
                    }}
                  >
                    <td>
                      <Check
                        title={"Select " + row.id}
                        checked={ticked.includes(row.id)}
                        onChange={(value) => {
                          setTicked(
                            value
                              ? [...ticked, row.id]
                              : ticked.filter((id) => id !== row.id),
                          );
                          ctx.done("preview");
                        }}
                      />
                    </td>
                    {cells(row).map((value, index) => (
                      <td key={columns[index]}>{value}</td>
                    ))}
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={9}>
                      No sample mirror warnings or flips match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {receipt.length > 0 && (
            <Receipt title="Sample mirror-state readback" entries={receipt} />
          )}
          <p className="mirror-note">
            Fictional sample data. Valid hand or facing flips are excluded from
            Resolve. The protected cabinet demonstrates a correction left
            unchanged.
          </p>
        </div>
      </DialogShell>
      <ConfirmGuard
        open={pending}
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Arch Sentinel - confirm Resolve"
        instruction=""
        content={
          "Resolve the mirror state of " +
          selected.length +
          " instance(s)?\n\nEach instance keeps its position, type, host, hand and swing; any instance that cannot is left unchanged."
        }
        confirmLabel="Resolve"
        cancelLabel="Cancel"
        onConfirm={resolve}
        onCancel={() => setPending(false)}
      />
    </div>
  );
}
