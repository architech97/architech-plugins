import { useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, Radio, Select, TextBox } from "../../ui";
import { DialogShell, Receipt, TaskDialogShell } from "../../kit";
import "./style.css";

const host = [
  { id: 301144, name: "Interior wall", bounds: [0, 0, 0, 4200, 200, 3000] },
  {
    id: 348211,
    name: "Single flush door",
    bounds: [1200, 0, 0, 2100, 200, 2100],
  },
  { id: 372105, name: "Base cabinet", bounds: [2800, 500, 0, 3400, 1100, 900] },
];
const linked = [
  { id: 42011, name: "Structural column", bounds: [0, 0, 0, 400, 400, 3200] },
  { id: 42012, name: "Structural beam", bounds: [0, 0, 2800, 4800, 300, 3200] },
];
const active = "Apply to active orthographic 3D view, or a dedicated view";
const dedicated = "Create or update dedicated 3D section box view";
export default function SectionBox(ctx: DemoContext) {
  const [screen, setScreen] = useState<"source" | "pick" | "options">("source");
  const [source, setSource] = useState<"host" | "linked">("host");
  const [picks, setPicks] = useState<number[]>([]);
  const [link, setLink] = useState("Structure · Instance 7101");
  const [padding, setPadding] = useState("500 mm");
  const [target, setTarget] = useState(dedicated);
  const [view, setView] = useState("ArchiTECH_3D_Sample");
  const [orientation, setOrientation] = useState("current");
  const [isolate, setIsolate] = useState(false);
  const [status, setStatus] = useState("");
  const [receipt, setReceipt] = useState<string[]>([]);
  const options = source === "host" ? host : linked;
  function choose(value: "host" | "linked") {
    setSource(value);
    setPicks([]);
    setIsolate(false);
    setOrientation("current");
    setScreen("pick");
    setStatus("");
  }
  function apply() {
    const match = /^\s*(\d+(?:\.\d+)?)\s*(mm|cm|m|ft|in|'|")?\s*$/i.exec(
      padding,
    );
    if (!match) {
      setStatus("Enter a non-negative length, for example 500 mm or 2 ft.");
      return;
    }
    const unit = (match[2] ?? "mm").toLowerCase();
    const mm =
      Number(match[1]) *
      ({ mm: 1, cm: 10, m: 1000, ft: 304.8, in: 25.4, "'": 304.8, '"': 25.4 }[
        unit
      ] ?? 1);
    if (!Number.isFinite(mm)) {
      setStatus("Enter a non-negative length, for example 500 mm or 2 ft.");
      return;
    }
    if (!match[2] && mm > 9144) {
      setStatus(
        "That padding is over 9 m in project units. Add the unit, for example 500 mm.",
      );
      return;
    }
    const selected = options.filter((row) => picks.includes(row.id));
    if (!selected.length) {
      setStatus("No elements were selected.");
      return;
    }
    const minimum = [0, 1, 2].map(
      (axis) => Math.min(...selected.map((row) => row.bounds[axis])) - mm,
    );
    const maximum = [3, 4, 5].map(
      (axis) => Math.max(...selected.map((row) => row.bounds[axis])) + mm,
    );
    const name =
      target === dedicated
        ? view.trim() || "ArchiTECH_3D_Sample"
        : "ArchiTECH_SectionBox_Sample";
    setReceipt([
      "Sample 3D view: " +
        name +
        " · " +
        selected.length +
        " " +
        (source === "host" ? "host" : "linked") +
        " element(s).",
      "Padded bounds (mm): [" +
        minimum.map((value) => value.toFixed(0)).join(", ") +
        "] → [" +
        maximum.map((value) => value.toFixed(0)).join(", ") +
        "].",
      orientation === "link"
        ? "Box axes parallel to Structure link instance 7101."
        : "Current section box orientation retained.",
      isolate
        ? "Selected sample host elements temporarily isolated."
        : "No temporary isolation applied.",
    ]);
    setStatus(
      target === active
        ? 'The active view is not an orthographic 3D view, so the section box was applied to the 3D view "' +
            name +
            '", which is now open.'
        : "Section box applied to the sample dedicated 3D view.",
    );
    ctx.done("preview");
    ctx.done("apply");
  }
  if (screen === "source")
    return (
      <TaskDialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Section Box"
        instruction="Choose elements for the section box"
        onClose={ctx.close}
        footer={
          <div className="dk-task-buttons stacked" data-demo="section-source">
            <Btn onClick={() => choose("host")}>
              Host elements
              <small>
                Use the current selection or pick elements in this model.
              </small>
            </Btn>
            <Btn onClick={() => choose("linked")}>
              Linked elements
              <small>
                Pick elements in a loaded top-level link. Nested links are
                unsupported.
              </small>
            </Btn>
            <Btn onClick={ctx.close}>Cancel</Btn>
          </div>
        }
      />
    );
  if (screen === "pick")
    return (
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Select elements for the Section Box, then click Finish"
        subtitle="Browser sample picker · Fictional project elements"
        onClose={ctx.close}
        footer={
          <>
            <span role="status">{picks.length} element(s) selected.</span>
            <Btn onClick={() => setScreen("source")}>Cancel</Btn>
            <Btn
              primary
              disabled={!picks.length}
              onClick={() => {
                setScreen("options");
                setStatus(
                  picks.length +
                    " element" +
                    (picks.length === 1 ? "" : "s") +
                    " selected. The active view is not a 3D view, so a dedicated 3D view will be used.",
                );
                ctx.done("configure");
              }}
            >
              Finish
            </Btn>
          </>
        }
      >
        <div className="section-options">
          {source === "linked" && (
            <Select
              label="Sample top-level link"
              value={link}
              options={["Structure · Instance 7101"]}
              onChange={setLink}
            />
          )}
          {options.map((row) => (
            <Check
              key={row.id}
              label={row.id + " · " + row.name}
              checked={picks.includes(row.id)}
              onChange={(value) =>
                setPicks(
                  value
                    ? [...picks, row.id]
                    : picks.filter((id) => id !== row.id),
                )
              }
            />
          ))}
          <p className="ad-note">
            This picker represents Revit's element-selection step. It selects
            only fictional browser records.
          </p>
        </div>
      </DialogShell>
    );
  return (
    <div className="section-options">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Section Box"
        onClose={ctx.close}
        footer={
          <>
            <span className="section-status" role="status">
              {status}
            </span>
            <Btn onClick={ctx.close}>Cancel</Btn>
            <Btn primary demo="section-apply" onClick={apply}>
              Apply Section Box
            </Btn>
          </>
        }
      >
        <div className="section-options">
          <b>PADDING</b>
          <div className="section-padding" data-demo="section-padding">
            <TextBox
              aria-label="Padding"
              value={padding}
              onChange={(event) => {
                setPadding(event.target.value);
                setReceipt([]);
              }}
            />
            {["250 mm", "500 mm", "1000 mm"].map((value) => (
              <Btn key={value} onClick={() => setPadding(value)}>
                {value}
              </Btn>
            ))}
          </div>
          <b>TARGET 3D VIEW</b>
          <Radio
            name="section-view"
            label={active}
            checked={target === active}
            onChange={() => setTarget(active)}
          />
          <Radio
            name="section-view"
            label={dedicated}
            checked={target === dedicated}
            onChange={() => setTarget(dedicated)}
          />
          {target === dedicated && (
            <label className="section-view-name">
              View Name:
              <TextBox
                aria-label="View Name"
                value={view}
                onChange={(event) => setView(event.target.value)}
              />
            </label>
          )}
          <b>BOX ORIENTATION</b>
          <Radio
            name="section-orientation"
            label="Current section box orientation"
            checked={orientation === "current"}
            onChange={() => setOrientation("current")}
          />
          <label className="ad-check">
            <input
              type="radio"
              name="section-orientation"
              aria-label="Parallel to selected link (one link instance only)"
              disabled={source !== "linked"}
              checked={orientation === "link"}
              onChange={() => setOrientation("link")}
            />
            Parallel to selected link (one link instance only)
          </label>
          <b>OPTIONS</b>
          <Check
            label="Temporarily isolate selected elements inside section box"
            disabled={source === "linked"}
            checked={isolate}
            onChange={setIsolate}
          />
        </div>
        {receipt.length > 0 && (
          <Receipt title="Sample section box readback" entries={receipt} />
        )}
      </DialogShell>
    </div>
  );
}
