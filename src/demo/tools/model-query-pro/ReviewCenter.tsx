import { useEffect, useRef, useState } from "react";
import type { DemoContext } from "../../types";
import {
  Btn,
  Check,
  Expander,
  SearchBox,
  Select,
  Tabs,
  TextBox,
} from "../../ui";
import { DialogShell, TaskDialogShell } from "../../kit";
import { ELEMENTS, sampleInspection } from "./data";

interface Finding {
  id: string;
  title: string;
  severity: string;
  check: string;
  profiles: string[];
  level: string;
  phase: string;
  option: string;
  ids: number[];
  evidence: string;
}
const FINDINGS: Finding[] = [
  {
    id: "wall-overlap",
    title: "Highlighted walls overlap",
    severity: "Critical",
    check: "Revit warnings",
    profiles: ["Architecture", "Interiors", "Coordination", "Pre-handover"],
    level: "Level 01",
    phase: "Existing",
    option: "Main model only",
    ids: [301144, 301178],
    evidence:
      "Two sample walls overlap on Level 01. Review the affected geometry before changing the model.",
  },
  {
    id: "door-mark",
    title: "Missing door/window type mark",
    severity: "Warning",
    check: "Missing door/window type mark",
    profiles: ["Architecture", "Pre-handover"],
    level: "Level 01",
    phase: "New Construction",
    option: "Main model only",
    ids: [348211],
    evidence:
      "The sample door type has no Type Mark. The rule reviews type data; accepting an exception does not fill it in.",
  },
  {
    id: "room-finish",
    title: "Missing room floor finish",
    severity: "Warning",
    check: "Missing room floor finish",
    profiles: ["Interiors", "Pre-handover"],
    level: "Level 02",
    phase: "New Construction",
    option: "Option 01 · Courtyard",
    ids: [410022],
    evidence:
      "A sample room is missing Floor Finish. The affected set is limited by the captured profile and scope.",
  },
];
const descriptions: Record<string, string> = {
  Architecture:
    "Warnings, missing room numbers and missing door/window type marks. Checks use stable built-in identifiers.",
  Interiors:
    "Warnings; room floor/wall/ceiling/base finish data; FF&E type marks and manufacturer information.",
  Coordination:
    "Warnings and unpinned host link/import placements. Linked-model contents are not checked.",
  "Pre-handover":
    "Warnings, room numbers/finish data, door/window and FF&E type marks, FF&E manufacturer data and unpinned links/imports.",
};
const architectureChecks = [
  "Missing room number",
  "Missing door/window type mark",
];
const interiorsChecks = [
  "Missing room floor finish",
  "Missing room wall finish",
  "Missing room ceiling finish",
  "Missing room base finish",
  "Missing FF&E type mark",
  "Missing FF&E manufacturer",
];
const profileChecks: Record<string, string[]> = {
  Architecture: ["Revit warnings", ...architectureChecks],
  Interiors: ["Revit warnings", ...interiorsChecks],
  Coordination: ["Revit warnings", "Unpinned link/import placement"],
  "Pre-handover": [
    "Revit warnings",
    ...architectureChecks,
    ...interiorsChecks,
    "Unpinned link/import placement",
  ],
};
export default function ReviewCenter({
  context: ctx,
  onBack,
  onInspect,
}: {
  context: DemoContext;
  onBack: () => void;
  onInspect: (ids: number[]) => void;
}) {
  const [profile, setProfile] = useState("Architecture");
  const [scope, setScope] = useState("Project");
  const [level, setLevel] = useState("All levels");
  const [phase, setPhase] = useState("All phases");
  const [option, setOption] = useState("All options");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState("Open issues");
  const [tab, setTab] = useState("Finding queue");
  const [issues, setIssues] = useState<Finding[]>([]);
  const [selected, setSelected] = useState("");
  const [accepted, setAccepted] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [stale, setStale] = useState(true);
  const [running, setRunning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [lastScanContext, setLastScanContext] = useState("");
  const [status, setStatus] = useState(
    "Choose a profile and scope, then Scan. Findings compare only with the same document, profile, scope and rule version.",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inspectionDialog = useRef<HTMLDialogElement>(null);
  const [inspectionReport, setInspectionReport] = useState("");
  useEffect(() => {
    if (inspectionReport) inspectionDialog.current?.showModal();
    else inspectionDialog.current?.close();
  }, [inspectionReport]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const checks = profileChecks[profile];
  const contextKey = [
    profile,
    scope,
    level,
    phase,
    option,
    ...excluded.slice().sort(),
  ].join("|");
  const decisionKey = (finding: Finding) => lastScanContext + ":" + finding.id;
  const visible = issues.filter(
    (finding) =>
      (state === "All findings" ||
        (state === "Open issues"
          ? !(decisionKey(finding) in accepted)
          : state === "Accepted"
            ? decisionKey(finding) in accepted
            : false)) &&
      [finding.title, finding.evidence, ...finding.ids.map(String)]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const current = visible.find((finding) => finding.id === selected);
  const actionable = Boolean(current) && !stale && !running;

  function invalidate() {
    setStale(true);
    setStatus(
      "Profile or scope changed. Scan to produce a matching review; the previous queue is stale.",
    );
  }
  function scan() {
    setRunning(true);
    setStale(true);
    setStatus("Preparing the selected host-model scope…");
    timer.current = setTimeout(() => {
      const results = FINDINGS.filter(
        (finding) =>
          finding.profiles.includes(profile) &&
          !excluded.includes(finding.check) &&
          (level === "All levels" || finding.level === level) &&
          (phase === "All phases" || finding.phase === phase) &&
          (option === "All options" || finding.option === option) &&
          (scope !== "Active view" || finding.level === "Level 01") &&
          (scope !== "Selection" ||
            finding.ids.some((id) => [348211, 410022].includes(id))),
      );
      setIssues(results);
      setSelected("");
      setReason("");
      setRunning(false);
      setStale(false);
      setScanned(true);
      setLastScanContext(contextKey);
      setStatus(
        "Sample scan complete. " +
          results.length +
          " finding(s). " +
          (lastScanContext === contextKey
            ? "Compared with the previous scan in this exercise."
            : "No matching previous scan.") +
          " Browser exercise data only.",
      );
      ctx.done("configure");
      ctx.done("preview");
    }, 700);
  }
  function cancel() {
    clearTimeout(timer.current);
    setRunning(false);
    setStale(true);
    setStatus(
      "Scan cancelled before it completed. Previous results remain stale.",
    );
  }
  function decide(accept: boolean) {
    if (!current || !actionable) return;
    if (accept && !reason.trim()) {
      setStatus("Enter a reason for accepting this exception.");
      return;
    }
    if (accept && reason.length > 2000) {
      setStatus("The acceptance reason must be 2000 characters or fewer.");
      return;
    }
    const next = { ...accepted };
    if (accept) next[decisionKey(current)] = reason.trim();
    else delete next[decisionKey(current)];
    setAccepted(next);
    setSelected("");
    setReason("");
    setStatus(
      accept
        ? "Accepted exception recorded with its reason. Session-only browser review; the sample model was not changed."
        : "Exception reopened. Session-only browser review; the sample model was not changed.",
    );
    ctx.done("apply");
  }
  return (
    <div className="query-body">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="ARCH SENTINEL / REVIEW CENTER"
        subtitle="Find, inspect and verify · Fictional Sample Residence"
        onClose={() => {
          clearTimeout(timer.current);
          onBack();
        }}
        footer={
          <>
            <span className="ad-status query-status" role="status">
              {status}
            </span>
            <Btn
              onClick={() =>
                setStatus(
                  "Temporary isolation reset in the sample active view.",
                )
              }
            >
              Reset isolation
            </Btn>
            <Btn
              onClick={() => {
                clearTimeout(timer.current);
                onBack();
              }}
            >
              Close
            </Btn>
          </>
        }
      >
        <div className="query-fields">
          <fieldset disabled={running} className="review-scope-fields">
            <label>
              Review profile
              <Select
                label="Review profile"
                value={profile}
                options={Object.keys(descriptions)}
                onChange={(value) => {
                  setProfile(value);
                  setExcluded([]);
                  invalidate();
                }}
              />
            </label>
            <label>
              Base scope
              <Select
                label="Base scope"
                value={scope}
                options={["Project", "Active view", "Selection"]}
                onChange={(value) => {
                  setScope(value);
                  invalidate();
                }}
              />
            </label>
            <label>
              Level
              <Select
                label="Level filter"
                value={level}
                options={["All levels", "Level 01", "Level 02"]}
                onChange={(value) => {
                  setLevel(value);
                  invalidate();
                }}
              />
            </label>
            <label>
              Created phase
              <Select
                label="Created phase filter"
                value={phase}
                options={["All phases", "Existing", "New Construction"]}
                onChange={(value) => {
                  setPhase(value);
                  invalidate();
                }}
              />
            </label>
            <label>
              Design option
              <Select
                label="Design option filter"
                value={option}
                options={[
                  "All options",
                  "Main model only",
                  "Option 01 · Courtyard",
                ]}
                onChange={(value) => {
                  setOption(value);
                  invalidate();
                }}
              />
            </label>
          </fieldset>
          <Btn primary disabled={running} demo="review-scan" onClick={scan}>
            Scan / verify again
          </Btn>
          <Btn disabled={!running} onClick={cancel}>
            Cancel scan
          </Btn>
        </div>
        <p className="query-note">{descriptions[profile]}</p>
        <Expander header="Included profile checks — customize this model's review">
          <p className="query-note">
            Selections apply to the current browser exercise. A changed check
            set starts a separate comparison context.
          </p>
          <div className="ad-row">
            {checks.map((check) => (
              <Check
                key={check}
                label={check}
                disabled={running}
                checked={!excluded.includes(check)}
                onChange={(value) => {
                  setExcluded(
                    value
                      ? excluded.filter((item) => item !== check)
                      : [...excluded, check],
                  );
                  invalidate();
                }}
              />
            ))}
          </div>
        </Expander>
        <div className="query-fields">
          <SearchBox
            placeholder="Search findings, evidence or element ID"
            value={query}
            onChange={setQuery}
          />
          <Select
            label="Finding state"
            value={state}
            options={[
              "Open issues",
              "Accepted",
              "Resolved",
              "Unknown",
              "All findings",
            ]}
            onChange={setState}
          />
          <span>{visible.length} finding(s)</span>
        </div>
        <div className="review-layout">
          <section className="ad-card query-main">
            <Tabs
              tabs={["Finding queue", "Checks and timings"]}
              value={tab}
              onChange={setTab}
            />
            <div
              className="ad-table-wrap"
              role="region"
              tabIndex={0}
              aria-label={tab}
            >
              {tab === "Finding queue" ? (
                <table className="ad-table">
                  <thead>
                    <tr>
                      {[
                        "Review class",
                        "Finding",
                        "Comparison",
                        "State",
                        "Elements",
                      ].map((label) => (
                        <th scope="col" key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((finding) => (
                      <tr
                        key={finding.id}
                        className={selected === finding.id ? "sel" : undefined}
                        aria-selected={selected === finding.id}
                        tabIndex={0}
                        onClick={() => {
                          setSelected(finding.id);
                          setReason(accepted[decisionKey(finding)] ?? "");
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelected(finding.id);
                            setReason(accepted[decisionKey(finding)] ?? "");
                          }
                        }}
                      >
                        <td>{finding.severity}</td>
                        <td>{finding.title}</td>
                        <td>{scanned ? "Current" : "—"}</td>
                        <td>
                          {decisionKey(finding) in accepted
                            ? "Accepted"
                            : "Open"}
                        </td>
                        <td>{finding.ids.length}</td>
                      </tr>
                    ))}
                    {!visible.length && (
                      <tr>
                        <td colSpan={5}>
                          {stale
                            ? "Scan the intended profile and scope to review findings."
                            : "No findings match the current filters."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="ad-table">
                  <thead>
                    <tr>
                      {[
                        "Check",
                        "Outcome",
                        "Reviewed",
                        "Issues",
                        "Errors",
                        "Read ms",
                      ].map((label) => (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scanned &&
                      checks
                        .filter((check) => !excluded.includes(check))
                        .map((check) => (
                          <tr key={check}>
                            <td>{check}</td>
                            <td>{stale ? "Stale" : "Completed"}</td>
                            <td>{check === "Revit warnings" ? 2 : 1}</td>
                            <td>
                              {
                                issues.filter((issue) => issue.check === check)
                                  .length
                              }
                            </td>
                            <td>0</td>
                            <td>Sample</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
          <section
            className="ad-card query-main"
            aria-label="Review selected finding"
          >
            <b>REVIEW SELECTED FINDING</b>
            <h3>{current?.title}</h3>
            <p>
              {current?.evidence ??
                "Scan the intended profile and scope, then select a finding to review its evidence."}
            </p>
            <label>
              AFFECTED ELEMENT IDS
              <TextBox
                aria-label="Affected element IDs"
                readOnly
                value={current?.ids.join(", ") ?? ""}
              />
            </label>
            <label>
              Accepted exception reason
              <textarea
                className="ad-textarea"
                aria-label="Reason for accepting exception"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </label>
            <p className="query-note">
              Acceptance records a local review decision. It does not correct or
              change the Revit model.
            </p>
            <div className="ad-row">
              {["Select", "Show", "Isolate in 3D"].map((action) => (
                <Btn
                  key={action}
                  disabled={!actionable}
                  onClick={() =>
                    setStatus(
                      action + " · Sample IDs " + current?.ids.join(", "),
                    )
                  }
                >
                  {action}
                </Btn>
              ))}
            </div>
            <Btn
              disabled={!actionable}
              onClick={() => {
                if (!current) return;
                const first = ELEMENTS.find(
                  (element) => element.id === current.ids[0],
                );
                if (!first) {
                  setStatus(
                    "The first affected element was not found in the sample document.",
                  );
                  return;
                }
                onInspect(current.ids);
                setInspectionReport(sampleInspection(first));
                setStatus(
                  "Requested inspection of the first affected element in Model Query. The complete affected set remains in this queue.",
                );
              }}
            >
              Inspect in Model Query
            </Btn>
            <div className="ad-row">
              <Btn
                disabled={
                  !actionable ||
                  Boolean(current && decisionKey(current) in accepted)
                }
                onClick={() => decide(true)}
              >
                Accept exception
              </Btn>
              <Btn
                disabled={
                  !actionable || !current || !(decisionKey(current) in accepted)
                }
                onClick={() => decide(false)}
              >
                Reopen
              </Btn>
            </div>
          </section>
        </div>
        <dialog
          className="dk-guard"
          ref={inspectionDialog}
          aria-label="Element visibility review"
          onCancel={(event) => {
            event.preventDefault();
            setInspectionReport("");
          }}
        >
          <TaskDialogShell
            showTheme={false}
            theme={ctx.theme}
            onTheme={ctx.setTheme}
            title="Element visibility review"
            content={<p className="query-status">{inspectionReport}</p>}
            onClose={() => setInspectionReport("")}
            buttons={[{ label: "OK", onClick: () => setInspectionReport("") }]}
          />
        </dialog>
      </DialogShell>
    </div>
  );
}
