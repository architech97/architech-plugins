import { useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, SearchBox, Tabs } from "../../ui";
import { ConfirmGuard, DialogShell, Receipt } from "../../kit";
import { downloadCsv } from "../../demos/craftedTools";
import "./style.css";

const modes = ["Detail groups", "Model groups", "Ungroup"] as const;
type Mode = (typeof modes)[number];
interface Group {
  id: number;
  name: string;
  kind: "detail" | "model";
  members: number;
  instances: { id: number; view?: string; borrowed?: boolean }[];
}
const initial: Group[] = [
  {
    id: 350004,
    name: "Bathroom detail symbols",
    kind: "detail",
    members: 12,
    instances: [
      { id: 352211, view: "A-501, Typical details" },
      { id: 352260, view: "A-502, Kitchen details" },
    ],
  },
  {
    id: 350051,
    name: "Door head detail",
    kind: "detail",
    members: 8,
    instances: [{ id: 352412, view: "A-501, Typical details" }],
  },
  {
    id: 350109,
    name: "Unplaced annotation group",
    kind: "detail",
    members: 4,
    instances: [],
  },
  {
    id: 360004,
    name: "Unit 01 – Furniture",
    kind: "model",
    members: 12,
    instances: [{ id: 362211 }, { id: 362260 }],
  },
  {
    id: 360051,
    name: "Typical Toilet Layout",
    kind: "model",
    members: 8,
    instances: [{ id: 362412 }, { id: 362413, borrowed: true }],
  },
  {
    id: 360109,
    name: "Kitchen Base Cabinets",
    kind: "model",
    members: 17,
    instances: [{ id: 362516 }],
  },
  {
    id: 360199,
    name: "Unplaced model group",
    kind: "model",
    members: 5,
    instances: [],
  },
];

export default function GroupManager(ctx: DemoContext) {
  const [mode, setMode] = useState<Mode>("Detail groups");
  const [groups, setGroups] = useState(initial);
  const [query, setQuery] = useState("");
  const [ticked, setTicked] = useState<number[]>([]);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [receipt, setReceipt] = useState<string[]>([]);
  const [isolated, setIsolated] = useState<number[]>([]);
  const ungroup = mode === "Ungroup";
  const kind = mode === "Detail groups" ? "detail" : "model";
  const rows = groups.filter(
    (row) => row.kind === kind && (!ungroup || row.instances.length > 0),
  );
  const shown = rows.filter((row) =>
    row.name.toLowerCase().includes(query.toLowerCase()),
  );
  const picks = rows.filter((row) => ticked.includes(row.id));
  const count = picks.reduce((sum, row) => sum + row.instances.length, 0);

  function switchMode(next: Mode) {
    setMode(next);
    setTicked([]);
    setStatus("");
    setReceipt([]);
    ctx.rewind("configure");
    ctx.done("configure");
  }

  function inspect(row: Group, action: "isolate" | "select" | "view") {
    ctx.done("preview");
    if (!row.instances.length) {
      setStatus(
        action === "isolate"
          ? "No instances to isolate — this type is unplaced."
          : "No instances to select — this type is unplaced.",
      );
      return;
    }
    if (action === "view") {
      setStatus(
        "Showing instance " +
          row.instances[0].id +
          " of '" +
          row.name +
          "' in the sample model.",
      );
      return;
    }
    if (action === "select") {
      setStatus(
        "Selected " +
          row.instances.length +
          " instance(s) of '" +
          row.name +
          "'.",
      );
      return;
    }
    const owner = row.instances[0].view;
    const targets =
      kind === "detail"
        ? row.instances.filter((instance) => instance.view === owner)
        : row.instances;
    setIsolated(targets.map((instance) => instance.id));
    const elsewhere = row.instances.length - targets.length;
    setStatus(
      "Isolated " +
        targets.length +
        " instance(s) of '" +
        row.name +
        "' in " +
        (owner ?? "{3D}") +
        (elsewhere ? " (" + elsewhere + " more in other views)" : "") +
        ".",
    );
  }

  function applyUngroup() {
    const chosen = new Set(picks.map((row) => row.id));
    const targets = picks.flatMap((row) => row.instances);
    const skipped = targets.filter((instance) => instance.borrowed).length;
    const changed = targets.length - skipped;
    setGroups(
      groups.map((row) =>
        chosen.has(row.id)
          ? {
              ...row,
              instances: row.instances.filter((instance) => instance.borrowed),
            }
          : row,
      ),
    );
    setTicked([]);
    setPending(false);
    setReceipt([
      "Ungroup complete.\n\nUngrouped: " +
        changed +
        " instance(s) across " +
        picks.length +
        " type(s)\nFailed:    0\nSkipped:   " +
        skipped +
        " (group or a member borrowed by another user)",
      "Sample member elements were preserved. Only the eligible group containers were dissolved.",
    ]);
    setStatus("");
    ctx.done("apply");
    ctx.notify({
      kind: skipped ? "warning" : "success",
      text:
        changed +
        " sample group containers dissolved. " +
        skipped +
        " borrowed instances retained.",
    });
  }

  return (
    <div className="group-demo">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Group Manager"
        subtitle={
          rows.length +
          " " +
          (ungroup ? "placed model" : kind) +
          " group type(s) | " +
          rows.reduce((sum, row) => sum + row.instances.length, 0) +
          " total instance(s)"
        }
        onClose={ctx.close}
        footer={
          <>
            <span className="ad-status" role="status">
              {status || "Sample Residence, Browser simulation"}
            </span>
            {ungroup && (
              <Btn
                primary
                demo="group-ungroup"
                disabled={!picks.length}
                onClick={() => setPending(true)}
              >
                Ungroup selected
              </Btn>
            )}
            <Btn onClick={ctx.close}>Close</Btn>
          </>
        }
      >
        <div
          className="group-demo"
          onKeyDown={(event) => {
            if (event.key === "Tab" && event.ctrlKey) {
              event.preventDefault();
              switchMode(
                modes[(modes.indexOf(mode) + (event.shiftKey ? 2 : 1)) % 3],
              );
            }
          }}
        >
          <Tabs
            tabs={modes}
            value={mode}
            onChange={switchMode}
            demo="group-modes"
          />
          <div className="ad-row">
            <SearchBox
              placeholder="Filter group types..."
              value={query}
              onChange={setQuery}
            />
            {ungroup && (
              <>
                <Btn
                  onClick={() => {
                    setTicked([
                      ...new Set([...ticked, ...shown.map((row) => row.id)]),
                    ]);
                    ctx.done("preview");
                  }}
                >
                  Select all visible
                </Btn>
                <Btn onClick={() => setTicked([])}>Clear</Btn>
              </>
            )}
            <Btn
              onClick={() => {
                setIsolated([]);
                setStatus("Temporary isolation reset in the sample view.");
              }}
            >
              Reset isolation
            </Btn>
            <Btn
              onClick={() => {
                downloadCsv(
                  "Sample-Residence-Groups.csv",
                  [
                    "#",
                    "Group type name",
                    "Instances",
                    "Members per group",
                    "Type ID",
                    "Instance IDs",
                  ],
                  rows.map((row, index) => [
                    index + 1,
                    row.name,
                    row.instances.length,
                    row.members,
                    row.id,
                    row.instances.map((instance) => instance.id).join(", "),
                  ]),
                );
                setStatus(
                  "Exported the full current sample group list as CSV. The desktop tool writes XLSX.",
                );
              }}
            >
              Export
            </Btn>
          </div>
          <div
            className="ad-table-wrap group-grid"
            data-demo="group-table"
            tabIndex={0}
            role="region"
            aria-label="Group types"
          >
            <table className="ad-table">
              <thead>
                <tr>
                  {ungroup && <th scope="col">Ungroup</th>}
                  {[
                    "#",
                    "Group Type Name",
                    "Instances",
                    "Members",
                    "Type ID",
                    "Instance IDs",
                    "Actions",
                  ].map((label) => (
                    <th scope="col" key={label}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <tr key={row.id}>
                    {ungroup && (
                      <td>
                        <Check
                          title={"Ungroup " + row.name}
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
                    )}
                    <td>{rows.indexOf(row) + 1}</td>
                    <td className="group-name">{row.name}</td>
                    <td>{row.instances.length}</td>
                    <td>{row.members}</td>
                    <td>{row.id}</td>
                    <td>
                      {row.instances
                        .map((instance) => instance.id)
                        .join(", ") || "—"}
                    </td>
                    <td>
                      <div className="ad-row">
                        <Btn
                          sm
                          aria-label={"Isolate " + row.name}
                          onClick={() => inspect(row, "isolate")}
                        >
                          Isolate
                        </Btn>
                        <Btn
                          sm
                          aria-label={"Select " + row.name}
                          onClick={() => inspect(row, "select")}
                        >
                          Select
                        </Btn>
                        {ungroup && (
                          <Btn
                            sm
                            aria-label={"View " + row.name}
                            onClick={() => inspect(row, "view")}
                          >
                            View
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr>
                    <td colSpan={ungroup ? 8 : 7}>No matching group types.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isolated.length > 0 && (
            <p className="group-note">
              Isolated sample IDs, {isolated.join(", ")}
            </p>
          )}
          {receipt.length > 0 && <Receipt entries={receipt} />}
          <p className="group-note">
            Sample data is fictional. Detail groups isolate in their owner view.
            Browsing modes preserve the group containers.
          </p>
        </div>
      </DialogShell>
      <ConfirmGuard
        open={pending}
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Confirm Ungroup"
        instruction=""
        content={
          "About to UNGROUP " +
          count +
          " instance(s) across " +
          picks.length +
          " type(s).\n\nMember elements are PRESERVED — only the group containers are dissolved.\n\nUndoable via Ctrl+Z. Continue?"
        }
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={applyUngroup}
        onCancel={() => setPending(false)}
      />
    </div>
  );
}
