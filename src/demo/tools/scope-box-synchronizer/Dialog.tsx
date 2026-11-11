import { useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, SearchBox, Select } from "../../ui";
import { ConfirmGuard, DialogShell, Receipt } from "../../kit";
import "./style.css";

const links = [
  "Sample Residence – Structure.rvt (Sample Master)",
  "Sample Residence – Architecture.rvt (Sample Master)",
];
interface Box {
  id: number;
  name: string;
  hostId?: number;
  drift?: number;
  assignments: number;
}
const fixture: Box[] = [
  {
    id: 7401,
    name: "Core – Level 01",
    hostId: 7501,
    drift: 45,
    assignments: 2,
  },
  {
    id: 7402,
    name: "Building Overall",
    hostId: 7502,
    drift: 0,
    assignments: 0,
  },
  { id: 7403, name: "East Wing – Level 02", assignments: 0 },
];
const measured = (box: Box) =>
  box.hostId === undefined || (box.drift ?? 0) > 1.5;

export default function ScopeBoxSync(ctx: DemoContext) {
  const [link, setLink] = useState(links[0]);
  const [boxes, setBoxes] = useState(fixture);
  const [scanned, setScanned] = useState(false);
  const [query, setQuery] = useState("");
  const [ticked, setTicked] = useState<number[]>([]);
  const [active, setActive] = useState<number>();
  const [assign, setAssign] = useState(true);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState(
    "Click 'Scan scope boxes' to evaluate differences.",
  );
  const [receipt, setReceipt] = useState<string[]>([]);
  const rows = scanned
    ? boxes.filter((box) =>
        box.name.toLowerCase().includes(query.toLowerCase()),
      )
    : [];
  const selected = boxes.filter((box) => ticked.includes(box.id));
  const replacing = selected.filter(
    (box) => box.hostId !== undefined && (box.drift ?? 0) > 1.5,
  );
  const repointed = replacing.reduce(
    (count, box) => count + box.assignments,
    0,
  );
  const activeBox = boxes.find((box) => box.id === active);

  function scan() {
    setScanned(true);
    setTicked(boxes.filter(measured).map((box) => box.id));
    setActive(undefined);
    setStatus(
      boxes.length +
        " linked scope boxes measured. Drift greater than 1.5 mm is flagged.",
    );
    setReceipt([]);
    ctx.done("configure");
    ctx.done("preview");
  }

  function sync() {
    const changed = selected.filter(measured);
    const newBoxes = changed.filter((box) => box.hostId === undefined).length;
    const updated = changed.length - newBoxes;
    let nextId = Math.max(8000, ...boxes.map((box) => box.hostId ?? 0)) + 1;
    const next = boxes.map((box) =>
      changed.includes(box) ? { ...box, hostId: nextId++, drift: 0 } : box,
    );
    setReceipt(
      changed.map((box) => {
        const after = next.find((row) => row.id === box.id)!;
        return (
          box.name +
          ", " +
          (box.hostId === undefined
            ? "Created host ID " + after.hostId
            : "Host ID " +
              box.hostId +
              " → " +
              after.hostId +
              ", Re-pointed " +
              box.assignments +
              " view/datum assignment(s)")
        );
      }),
    );
    setBoxes(next);
    setTicked([]);
    setPending(false);
    setStatus(
      "Synchronized selected boxes: " +
        newBoxes +
        " created, " +
        updated +
        " updated; " +
        (assign ? newBoxes + updated : 0) +
        " views assigned, 0 left unchanged (ambiguous, unrelated or unavailable).",
    );
    ctx.done("apply");
    ctx.notify({
      kind: "success",
      text: newBoxes + " sample boxes created and " + updated + " replaced.",
    });
  }

  return (
    <div className="scope-sync-body">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Scope Box Sync"
        subtitle="Match host scope boxes to a linked master model and reassign their views"
        onClose={ctx.close}
        footer={
          <>
            <span className="ad-status scope-status" role="status">
              {status}
            </span>
            <Btn
              onClick={() => {
                if (!scanned) {
                  setStatus(
                    "Scan scope boxes again; model data changed or has not been measured.",
                  );
                  return;
                }
                if (!activeBox || activeBox.hostId === undefined) {
                  setStatus(
                    "Please select a scope box that exists in the host project.",
                  );
                  return;
                }
                setStatus(
                  "Assigned scope box '" +
                    activeBox.name +
                    "' to active view 'Level 01 – Floor Plan'.",
                );
              }}
            >
              Assign to active view
            </Btn>
            <Btn
              primary
              demo="scope-sync"
              disabled={!scanned || !selected.length}
              onClick={() => (replacing.length ? setPending(true) : sync())}
            >
              Synchronize selected
            </Btn>
            <Btn onClick={ctx.close}>Close</Btn>
          </>
        }
      >
        <div className="scope-sync-body">
          <div className="ad-row">
            <label className="scope-link">
              Master link
              <Select
                label="Master link"
                value={link}
                options={links}
                onChange={(value) => {
                  setLink(value);
                  setScanned(false);
                  setTicked([]);
                  setActive(undefined);
                  setReceipt([]);
                  setStatus(
                    "Click 'Scan scope boxes' to evaluate differences.",
                  );
                  ctx.rewind("configure");
                }}
              />
            </label>
            <SearchBox
              placeholder="Filter scope boxes"
              value={query}
              onChange={setQuery}
            />
            <Btn demo="scope-scan" onClick={scan}>
              Scan scope boxes
            </Btn>
          </div>
          <div
            className="ad-table-wrap"
            data-demo="scope-table"
            tabIndex={0}
            role="region"
            aria-label="Scope box differences"
          >
            <table className="ad-table">
              <thead>
                <tr>
                  {[
                    "Sync",
                    "Scope Box Name",
                    "Status",
                    "Host Match",
                    "Drift (mm)",
                    "Source Link Extents",
                  ].map((label) => (
                    <th key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((box) => (
                  <tr
                    key={box.id}
                    className={box.id === active ? "sel" : undefined}
                    tabIndex={0}
                    aria-selected={box.id === active}
                    onClick={() => setActive(box.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        setActive(box.id);
                      }
                    }}
                  >
                    <td>
                      <Check
                        title={"Sync " + box.name}
                        checked={ticked.includes(box.id)}
                        onChange={(value) => {
                          setTicked(
                            value
                              ? [...ticked, box.id]
                              : ticked.filter((id) => id !== box.id),
                          );
                          ctx.done("preview");
                        }}
                      />
                    </td>
                    <td className="scope-name">{box.name}</td>
                    <td>
                      {box.hostId === undefined
                        ? "NEW IN LINK"
                        : (box.drift ?? 0) > 1.5
                          ? "DRIFT (>1.5 mm)"
                          : "SYNCHRONIZED"}
                    </td>
                    <td>
                      {box.hostId === undefined ? "— (Missing)" : box.name}
                    </td>
                    <td>
                      {box.hostId === undefined ? "—" : box.drift?.toFixed(1)}
                    </td>
                    <td>Eight geometry corners compared in host coordinates</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={6}>
                      {scanned
                        ? "No matching scope boxes."
                        : "Scan scope boxes to measure differences."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Check
            label="Assign each synchronized scope box to the floor plans whose level name matches"
            checked={assign}
            onChange={setAssign}
          />
          {receipt.length > 0 && (
            <Receipt title="Sample scope box readback" entries={receipt} />
          )}
          <p className="scope-receipt">
            Fictional Sample Residence. Replacing a drifted host box creates a
            new ElementId.
          </p>
        </div>
      </DialogShell>
      <ConfirmGuard
        open={pending}
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Scope Box Sync - confirm"
        instruction=""
        content={
          replacing.length +
          " drifted scope box(es) will be replaced with copies from the link.\n\nReplacement creates new elements (new ElementIds); " +
          repointed +
          " view/datum assignment(s) will be re-pointed. Anything else that referenced the old boxes by id will not follow.\n\nContinue?"
        }
        confirmLabel="Replace"
        cancelLabel="Cancel"
        onConfirm={sync}
        onCancel={() => setPending(false)}
      />
    </div>
  );
}
