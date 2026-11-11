import { useState } from "react";
import type { DemoContext } from "../../types";
import { Btn, Check, Expander, SearchBox, Select, TextBox } from "../../ui";
import { DialogShell, ScopeRadios, TaskDialogShell } from "../../kit";
import { downloadCsv } from "../../demos/craftedTools";
import ReviewCenter from "./ReviewCenter";
import {
  CATEGORIES,
  combine,
  ELEMENTS,
  firstRule,
  OPERATORS,
  PARAMETERS,
  PRESETS,
  presetRules,
  ruleMatches,
  valueOf,
} from "./data";
import type { Group, QueryElement, Rule } from "./data";
import "./style.css";

export default function ModelQuery(ctx: DemoContext) {
  const [scope, setScope] = useState("Active View");
  const [preset, setPreset] = useState(PRESETS[0]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [logic, setLogic] = useState("ALL (AND)");
  const [rules, setRules] = useState<Rule[]>([{ ...firstRule }]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [nextId, setNextId] = useState(2);
  const [results, setResults] = useState<QueryElement[]>([]);
  const [stale, setStale] = useState(true);
  const [status, setStatus] = useState("Ready.");
  const [inspection, setInspection] = useState("");
  const [inspectionResult, setInspectionResult] = useState("");
  const [colored, setColored] = useState(false);
  const [review, setReview] = useState(false);

  function invalidate() {
    setStale(true);
    setColored(false);
    ctx.rewind("configure");
  }
  function newRule(): Rule {
    const rule = { ...firstRule, id: nextId };
    setNextId(nextId + 1);
    return rule;
  }
  function setPresetRules(value: string) {
    const definition = presetRules(PRESETS.indexOf(value));
    setPreset(value);
    setRules(definition.rules);
    setGroups([]);
    setLogic(definition.logic);
    setCategories(definition.categories);
    setNextId(20);
    invalidate();
    ctx.done("configure");
  }
  function run() {
    if (
      presetRules(PRESETS.indexOf(preset)).categories.length &&
      !categories.length
    ) {
      setStatus(
        "No target categories selected for this preset. Select its categories or change the scope; the query was not run across the whole model.",
      );
      return;
    }
    const allRules = [...rules, ...groups.flatMap((group) => group.rules)];
    const unsafe = allRules.find(
      (rule) =>
        rule.operator === "MatchesRegex" &&
        rule.value !== "\\b(TODO|TEMP|FIXME|CHECK|TBD|\\?\\?\\?)\\b" &&
        (rule.value.length > 80 ||
          /[(){}]/.test(rule.value) ||
          /[+*?].*[+*?]/.test(rule.value)),
    );
    if (unsafe) {
      setStatus(
        "This browser exercise supports simple regular expressions. Use the native tool for grouped or repeated expressions.",
      );
      return;
    }
    try {
      const found = ELEMENTS.filter(
        (element) =>
          (scope === "Entire Project" || element.active) &&
          (!categories.length || categories.includes(element.category)) &&
          combine(
            [
              ...rules.map((rule) => ruleMatches(element, rule)),
              ...groups.map((group) =>
                combine(
                  group.rules.map((rule) => ruleMatches(element, rule)),
                  group.logic,
                ),
              ),
            ],
            logic,
          ),
      );
      setResults(found);
      setStale(false);
      setStatus(
        found.length
          ? "Query complete. Found " +
              found.length +
              " matching element" +
              (found.length === 1 ? "." : "s.")
          : "Query complete. No matching elements.",
      );
      ctx.done("configure");
      ctx.done("preview");
    } catch {
      setStatus(
        "The regular expression is not valid. Correct the rule and run again.",
      );
    }
  }
  function inspectionAction(action: string) {
    if (!/^[1-9]\d*$/.test(inspection.trim())) {
      setStatus("Enter a positive element ID from the active document.");
      return;
    }
    const element = ELEMENTS.find(
      (row) => String(row.id) === inspection.trim(),
    );
    if (element && action === "Inspect") {
      setInspectionResult(
        "Document: Sample Residence\nElement: " +
          element.type +
          " | ID " +
          element.id +
          "\nCategory: " +
          element.category +
          "\nView: Level 01 · Floor Plan | ID 101\n\n" +
          "No hiding cause was confirmed by these checks. This does not prove the element is visible.\nNot assessed: import/point-cloud global switches, crop/section box, view range, phases, design options, discipline/detail level, family visibility, occlusion and linked-document contents.\nInspection changes nothing. Select ID changes selection; Show ID asks Revit to locate the instance and may change the active view.",
      );
      return;
    }
    setStatus(
      element
        ? action +
            " ID " +
            element.id +
            " · " +
            element.category +
            " · " +
            element.family +
            " · " +
            element.level
        : "ID " +
            inspection.trim() +
            " was not found in the active document. Linked documents have separate IDs.",
    );
  }
  function renderRules(
    list: Rule[],
    update: (next: Rule[]) => void,
    includeCase = true,
  ) {
    return list.map((rule) => (
      <div className="query-rule" key={rule.id}>
        <Select
          label={"Rule parameter " + rule.id}
          value={rule.parameter}
          options={PARAMETERS}
          onChange={(value) => {
            update(
              list.map((item) =>
                item.id === rule.id ? { ...item, parameter: value } : item,
              ),
            );
            invalidate();
          }}
        />
        <Select
          label={"Rule operator " + rule.id}
          value={rule.operator}
          options={OPERATORS}
          onChange={(value) => {
            update(
              list.map((item) =>
                item.id === rule.id ? { ...item, operator: value } : item,
              ),
            );
            invalidate();
          }}
        />
        <TextBox
          aria-label={"Rule value " + rule.id}
          maxLength={80}
          disabled={["IsEmpty", "IsNotEmpty"].includes(rule.operator)}
          value={rule.value}
          onChange={(e) => {
            update(
              list.map((item) =>
                item.id === rule.id ? { ...item, value: e.target.value } : item,
              ),
            );
            invalidate();
          }}
        />
        {includeCase && (
          <Check
            label="Match Case"
            checked={rule.matchCase}
            onChange={(value) => {
              update(
                list.map((item) =>
                  item.id === rule.id ? { ...item, matchCase: value } : item,
                ),
              );
              invalidate();
            }}
          />
        )}
        <Btn
          sm
          aria-label={"Delete rule " + rule.id}
          onClick={() => {
            update(list.filter((item) => item.id !== rule.id));
            invalidate();
          }}
        >
          ×
        </Btn>
      </div>
    ));
  }

  if (inspectionResult)
    return (
      <TaskDialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Element visibility review"
        content={<p className="query-status">{inspectionResult}</p>}
        onClose={() => setInspectionResult("")}
        buttons={[{ label: "OK", onClick: () => setInspectionResult("") }]}
      />
    );
  if (review)
    return (
      <ReviewCenter
        context={ctx}
        onBack={() => setReview(false)}
        onInspect={(ids) => {
          setInspection(String(ids[0]));
          setStatus("Requested inspection of the first affected element.");
        }}
      />
    );

  return (
    <div className="query-body">
      <DialogShell
        theme={ctx.theme}
        onTheme={ctx.setTheme}
        title="Model Query Pro"
        subtitle="Fictional Sample Residence · Parameter query"
        onClose={() => {
          setColored(false);
          ctx.close();
        }}
        footer={
          <>
            <span className="ad-status query-status" role="status">
              {status}
            </span>
            <Btn
              onClick={() => {
                setColored(false);
                ctx.close();
              }}
            >
              Close
            </Btn>
          </>
        }
      >
        <div className="query-fields">
          <ScopeRadios
            label="SCOPE:"
            value={scope}
            options={["Active View", "Entire Project"]}
            onChange={(value) => {
              setScope(value);
              invalidate();
            }}
          />
          <label>
            REVIEW PRESET:
            <Select
              label="QA preset"
              value={preset}
              options={PRESETS}
              onChange={setPresetRules}
            />
          </label>
          <Btn
            onClick={() => {
              setColored(false);
              setStatus(
                "View isolation and query graphics reset in the sample view.",
              );
            }}
          >
            Reset View Isolation
          </Btn>
          <Btn demo="query-review" onClick={() => setReview(true)}>
            Review Center
          </Btn>
        </div>
        <div className="query-layout">
          <aside className="ad-card query-rail">
            <b>CATEGORIES</b>
            <SearchBox
              placeholder="Search categories"
              value={categorySearch}
              onChange={setCategorySearch}
            />
            <div className="ad-row">
              <Btn
                onClick={() => {
                  setCategories(CATEGORIES);
                  invalidate();
                }}
              >
                Select all
              </Btn>
              <Btn
                onClick={() => {
                  setCategories([]);
                  invalidate();
                }}
              >
                Clear all
              </Btn>
            </div>
            {CATEGORIES.filter((name) =>
              name.toLowerCase().includes(categorySearch.toLowerCase()),
            ).map((name) => (
              <Check
                key={name}
                label={
                  name +
                  " (" +
                  ELEMENTS.filter(
                    (row) =>
                      row.category === name &&
                      (scope === "Entire Project" || row.active),
                  ).length +
                  ")"
                }
                checked={categories.includes(name)}
                onChange={(value) => {
                  setCategories(
                    value
                      ? [...categories, name]
                      : categories.filter((item) => item !== name),
                  );
                  invalidate();
                }}
              />
            ))}
          </aside>
          <section className="query-main">
            <section
              className="ad-card query-rules"
              data-demo="query-builder"
              aria-label="Query rules"
            >
              <Expander header="Inspect an element by ID">
                <div className="ad-row">
                  <TextBox
                    aria-label="Element ID"
                    value={inspection}
                    onChange={(e) => setInspection(e.target.value)}
                    inputMode="numeric"
                  />
                  {["Inspect", "Select", "Show"].map((action) => (
                    <Btn key={action} onClick={() => inspectionAction(action)}>
                      {action} ID
                    </Btn>
                  ))}
                </div>
              </Expander>
              <div className="ad-row">
                <b>MATCH</b>
                <Select
                  label="Match logic"
                  value={logic}
                  options={["ALL (AND)", "ANY (OR)"]}
                  onChange={(value) => {
                    setLogic(value);
                    invalidate();
                  }}
                />
                <b>RULES</b>
                <Btn
                  onClick={() => {
                    setRules([...rules, newRule()]);
                    invalidate();
                  }}
                >
                  + Add Rule
                </Btn>
                <Btn
                  onClick={() => {
                    const rule = newRule();
                    setGroups([
                      ...groups,
                      { id: rule.id, logic: "ANY (OR)", rules: [rule] },
                    ]);
                    invalidate();
                  }}
                >
                  + Add Group
                </Btn>
                <Btn primary demo="query-run" onClick={run}>
                  Run Query
                </Btn>
              </div>
              {renderRules(rules, setRules)}
              {groups.map((group) => (
                <div className="query-subgroup" key={group.id}>
                  <div className="ad-row">
                    <b>SUB-GROUP:</b>
                    <Select
                      label={"Group match logic " + group.id}
                      value={group.logic}
                      options={["ALL (AND)", "ANY (OR)"]}
                      onChange={(value) => {
                        setGroups(
                          groups.map((item) =>
                            item.id === group.id
                              ? { ...item, logic: value }
                              : item,
                          ),
                        );
                        invalidate();
                      }}
                    />
                    <Btn
                      onClick={() => {
                        setGroups(
                          groups.map((item) =>
                            item.id === group.id
                              ? { ...item, rules: [...item.rules, newRule()] }
                              : item,
                          ),
                        );
                        invalidate();
                      }}
                    >
                      + Rule
                    </Btn>
                    <Btn
                      onClick={() => {
                        setGroups(
                          groups.filter((item) => item.id !== group.id),
                        );
                        invalidate();
                      }}
                    >
                      Remove Group
                    </Btn>
                  </div>
                  {renderRules(
                    group.rules,
                    (next) =>
                      setGroups(
                        groups.map((item) =>
                          item.id === group.id
                            ? { ...item, rules: next }
                            : item,
                        ),
                      ),
                    false,
                  )}
                </div>
              ))}
            </section>
            <section
              className="ad-card query-main"
              aria-label="Matching elements"
            >
              <b>
                MATCHING ELEMENTS ·{" "}
                {stale ? "Run Query to refresh" : results.length}
              </b>
              <div
                className="ad-table-wrap"
                tabIndex={0}
                role="region"
                aria-label="Query results"
              >
                <table className="ad-table">
                  <thead>
                    <tr>
                      {[
                        "Element ID",
                        "Category",
                        "Family",
                        "Type",
                        "Level",
                        "Matched Rule Value",
                      ].map((label) => (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((element) => (
                      <tr
                        className={colored ? "query-colored" : undefined}
                        key={element.id}
                      >
                        <td>{element.id}</td>
                        <td>{element.category}</td>
                        <td>{element.family}</td>
                        <td>{element.type}</td>
                        <td>{element.level}</td>
                        <td>
                          {rules
                            .map((rule) => valueOf(element, rule.parameter))
                            .join(" · ")}
                        </td>
                      </tr>
                    ))}
                    {!results.length && (
                      <tr>
                        <td colSpan={6}>
                          {stale
                            ? "Run a query to list matching sample elements."
                            : "No matching elements."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="ad-row">
                {[
                  "Select in Model",
                  "Isolate in View",
                  "Isolate in 3D View",
                  "Hide in View",
                ].map((action) => (
                  <Btn
                    key={action}
                    disabled={stale || !results.length}
                    onClick={() =>
                      setStatus(
                        action +
                          " · Sample IDs " +
                          results.map((row) => row.id).join(", "),
                      )
                    }
                  >
                    {action}
                  </Btn>
                ))}
                <Btn
                  disabled={stale || !results.length}
                  onClick={() => {
                    setColored(true);
                    setStatus(
                      "Highlighted " +
                        results.length +
                        " sample matches. Original graphics restore when this dialog closes.",
                    );
                  }}
                >
                  Colorize in View
                </Btn>
                <Btn
                  disabled={stale || !results.length}
                  onClick={() =>
                    downloadCsv(
                      "Sample-Residence-Model-Query.csv",
                      ["Element ID", "Category", "Family", "Type", "Level"],
                      results.map((row) => [
                        row.id,
                        row.category,
                        row.family,
                        row.type,
                        row.level,
                      ]),
                    )
                  }
                >
                  Export (Excel / CSV)...
                </Btn>
              </div>
            </section>
            <p className="query-note">
              Browser simulation · Fictional records. Complex regular
              expressions are exercised in the desktop tool.
            </p>
          </section>
        </div>
      </DialogShell>
    </div>
  );
}
