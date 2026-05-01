# How to Train

You are training the ClassCAD API skill by writing test scripts, running them against a live server, and recording what you learn. Your deliverable is **per-API LLM documentation** — practical, agent-oriented docs written to `knowledge/classcad-skill/references/<domain>/*.md`. The journal is your working notebook. The LLM docs are the point.

**Golden rule #1: Every task is LIVE.** You connect to the ClassCAD CLI and run real API calls. If a script fails, you debug it. If the docs are wrong, you note it. Nothing is theoretical.

**Golden rule #2: Read the reference docs before writing any code.** Do not guess parameter names, ID types, or return values.

**Pipeline: Plan → Read → Script → Run → Journal → Write LLM docs → changes.md → Checkpoint**

Every training session follows this pipeline. Unless the user gives you different instructions, you pick **one task** from `workspace/PLAN.md` and train on that task alone. Steps 1–2 are task selection and preparation. Steps 3–4 are exploration. Step 5 is the deliverable — writing or updating per-API LLM docs. Steps 6–7 are bookkeeping. A session is not complete until you have written the LLM doc file, recorded git diff changes in `changes.md` (or justified why none were needed), **and** marked the task complete in PLAN.md.

---

## Relevant repo layout

```
knowledge/
  classcad-skill/
    SKILL.md                          ← skill overview (read first for context)
    references/
      api/                            ← SOURCE docs (read-only, copied from @classcad/api-js)
        assembly.md
        common.md
        curve.md
        drawing2d.md
        part.md
        sketch.md
        solid.md
        expressions.md
      <domain>/                       ← YOUR LLM docs (one file per API — this is what you write)
        *.md                          ← <apiName>.md or generic.md
        ...
scripts/                              ← harness code (do not edit)
workspace/
  HOW-TO-TRAIN.md                     ← this file
  PLAN.md                             ← learning plan with checkboxes
  training/                           ← your training sessions go here!
    YYYY-MM-DD_HH-MM-SS_<topic>/
      scripts/                        ← your test scripts (one focused test per file)
      files/                          ← harness output (PNGs, STEP, OFB, logs, JSON dumps)
      journal.md                      ← your exploration log (written during Step 4)
      changes.md                      ← LLM doc diff (written during Step 6)
```

All paths below are relative to **`knowledge/classcad-skill/`** (the skill root).

**Two kinds of reference files — do not confuse them:**

| Path                         | Purpose                                                     | You edit?                          |
| ---------------------------- | ----------------------------------------------------------- | ---------------------------------- |
| `references/api/<domain>.md` | Source API documentation (parameters, types, return values) | **NO** — read-only                 |
| `references/<domain>/*.md`   | LLM-oriented docs (hints, findings, gotchas, examples)      | **YES** — this is your deliverable |

The 7 API domains and their namespaces are listed in `SKILL.md` (the domain index table). The pattern: source docs live at `references/api/<domain>.md` (read-only), your LLM docs go into `references/<domain>/*.md` (you create these).

## Read-only files — DO NOT EDIT

- **`SKILL.md`** and **`references/api/*.md`** — never modify. Source docs are ground truth.

Your deliverable goes exclusively into `references/<domain>/*.md` files that **you create and own**. Use `<apiName>.md` for API-specific docs, `generic.md` for conceptual topics that span multiple APIs.

---

## The harness

The harness (`node scripts/run.mjs`) is a thin test runner. It connects to ClassCAD, runs your script, captures snapshots, and cleans up.

```bash
node scripts/run.mjs <script-path> --outdir <session-folder> [--debug]
```

**What the harness does:**

- Connects to ClassCAD and passes `{ execute }` and `{ snapshot, filewrite }` to your script
- Runs your script's default export function
- Saves snapshots (`snapshot('label')`) as PNGs + STEP + OFB to `files/`
- Saves data dumps (`filewrite(data, 'label')`) as JSON/TXT/BIN to `files/`
- Auto-captures all `console.log`/`.error`/`.warn` output to `files/<scriptName>.log`
- Clears the drawing and disconnects after each run
- `--debug` disables all timeouts (connection + request) — useful for debugging

**The harness does NOT write your journal.** You write it.

### Logging results

Use `console.log` for compact, one-line findings that fit in stdout:

```js
console.log('[08] setObjectName:', r.maxLevel <= 31 ? '✓' : '❌')
console.log('[08] partId:', partId, 'boxId:', boxId)
console.log('[08] result:', r.result)
```

**Keep logs short and flat.** Do not `console.log(JSON.stringify(hugeObject))` — large structure trees (20KB+), graphic data, or base64 save content will blow up stdout and make it unreadable. If you need to inspect big or complex data, use `filewrite` instead:

```js
// Dump structure tree to files/05-my-script-structure.json
filewrite(r.structure, 'structure')

// Dump graphic mesh data
filewrite(r.graphic, 'meshes')

// Dump a base64 string
filewrite(saveResult.content, 'ofb-data')
```

`filewrite(data, label)` auto-detects the format:

- **Objects/arrays** → `.json` (pretty-printed)
- **Strings** → `.txt`
- **Buffers** → `.bin`
- Falls back to `util.inspect` if JSON serialization fails (circular refs, etc.)

Returns the relative path (`files/...`) and logs the file size to stdout.

---

## Step 1 — Pick the task from PLAN.md

Read `workspace/PLAN.md` in full. Scan the tables **in document order** (top to bottom). Find the **first row** where the `Studied` column contains `[ ]` (unchecked). This is your task for this session.

**Rules:**

- **One task per session.** Do not plow through multiple tasks. Depth over breadth.
- **No skipping.** Tasks are ordered by dependency. If a task in an earlier step or category is still `[ ]`, you must complete it first. Do not jump ahead.
- **Verify prerequisites.** All tasks above your target (in earlier categories and steps) must be `[✅]`. If any prerequisite is still `[ ]`, **stop and report the gap** — do not proceed.
- **If all tasks are `[✅]`**, report "All tasks completed." and stop.

Once you have identified the task, note its step, category, task number, and name. This scopes the rest of the session.

**Override:** If the user says "train on task X.Y.Z" or "skip to step N" or "do the next 3 tasks" — follow their instruction instead.

---

## Step 2 — Read the reference docs

All paths below are relative to `knowledge/classcad-skill/`. Read in this order:

1. **`SKILL.md`** — skim for overall context (domain index, conventions). You don't need to re-read this every session, but be familiar with it.

2. **`references/api/<domain>.md`** — the source API documentation for the domain your task belongs to. This is ground truth. Study:
   - Method signature and parameter table for your specific API — exact names, types, which are optional.
   - Return value structure — what comes back and how to use it.
   - Related methods in the same domain — understand the neighborhood.

3. **`references/<domain>/*.md`** — check if an LLM doc already exists for the task you are training on (`<apiName>.md` for API tasks, `generic.md` for conceptual topics).
   - **If it exists:** read it. This contains findings from a prior session. Verify, extend, or correct it.
   - **If it does not exist:** you will create it in Step 5. That's expected — this is what you are here to build.

## Step 3 — Create the session folder and journal

Create the session folder as shown in the repo layout above (`workspace/training/YYYY-MM-DD_HH-MM-SS_<topic>/`) with its `scripts/` and `files/` subdirectories.

Then create `journal.md` with a title, date, and a goal section. Write it after reading the reference docs so it reflects the actual scope. The format depends on your task type:

**For API tasks** ("Api study of ...") — list methods and parameters to cover:

```markdown
# Training: <topic>

**Date:** YYYY-MM-DD

## Goal

Testing `v1.part.boolean` and `v1.part.updateBoolean`.

**Methods to cover:**

- `boolean` — types: UNION, SUBTRACTION, INTERSECTION
- `boolean` params: id, type, target, tools, tools with indices, name
- `updateBoolean` — change type, change target, change tools after creation

**Questions:**

- How do target/tools params work? Can you pass multiple tools at once?
- What does `updateBoolean` return?
- What happens with non-overlapping bodies?
```

**For conceptual tasks** ("Study of ...") — list questions to answer:

```markdown
# Training: <topic>

**Date:** YYYY-MM-DD

## Goal

Studying the message system: `{ message, level, code, api }`.

**Questions to answer:**

- What levels exist and what do they mean?
- When does maxLevel differ from individual message levels?
- Do all APIs return messages, or only some?
- How do error messages differ from warning messages?
- Can a call succeed (valid result) but still have error-level messages?
```

## Step 4 — Write, run, and journal (the loop)

This is an iterative loop. Each iteration: write a script → run it → journal the result → check if you're done. **Stop iterating** when the coverage checklist is satisfied, or when you've written 20 scripts — whichever comes first. If you hit the cap, move to Step 5 with what you have and note any gaps in the journal.

**Two task types — pick the right track:**

```
  ┌─ Is this an "Api study of ..." task?
  │
  ├─ YES → Step 4A (API tasks)
  │         │
  │         ├─ write script (one method/param per script)
  │         ├─ run → journal
  │         ├─ done? → check API coverage checklist
  │         │          (params, enums, update/delete, realistic usage)
  │         └─ not done → next param/variant → loop
  │
  └─ NO → Step 4B (Conceptual tasks)
           │
           ├─ write script (one question per script, APIs are probes)
           ├─ run → journal
           ├─ done? → check conceptual coverage checklist
           │          (questions answered, edge cases, cross-API)
           └─ not done → next question → loop
```

- **API task** — prefixed with "Api study of" in PLAN.md. You are testing one specific API endpoint: its parameters, return values, edge cases.
- **Conceptual task** — prefixed with "Study of" or any non-API prefix. You are exploring a cross-cutting concept (protocol envelope, data types, ID system). APIs are tools you use to probe the concept, not the subject itself.

Name scripts sequentially: `01-up.mjs`, `02-down.mjs`, `03-symmetric.mjs`, etc.

---

### `execute()`, `snapshot()`, and `filewrite()`

**`api.v1.<domain>.<method>()`** — sends one API call using the typed @classcad/api-js wrapper. Returns the **full server envelope**:

```js
const r = await api.v1.part.create({ name: 'Test' })
// r.result    — the API return value (ID, object, array, void, etc.)
// r.messages  — array of { message, level } server messages
// r.maxLevel  — highest message level (0=ok, 41-50=warning, 51+=error)
// r.structure — full object tree of the drawing (huge — thousands of nodes)
// r.graphic   — rendering data (usually null in CLI context)
```

**All data is in `r`.** Log compact findings with `console.log`. For large data (structure trees, graphic payloads, base64 content), use `filewrite` instead. All console output is auto-captured to `files/<scriptName>.log`.

**`snapshot('label')`** — captures current state as PNG + STEP + OFB into `files/`. Snapshots are real evidence — they show shape, topology, and spatial relationships that numbers alone can miss. The renderer auto-scales geometry to fill the viewport, so size-only changes on a single body produce identical-looking images. For size verification, use numeric data alongside snapshots. But **never dismiss a snapshot that contradicts your numbers** — if the picture shows something changed and your data says it didn't, your measurement is probably wrong.

**`filewrite(data, 'label')`** — writes data to `files/`. Objects → `.json`, strings → `.txt`, buffers → `.bin`. **This is your primary verification tool.** Use it to persist:
- API responses (`r.result`, `r.messages`, `r.maxLevel`) — to verify what the server actually returned
- Graphic data (`r.graphic`) — to compare vertex counts, bounding boxes, mesh data before/after
- Structure trees (`r.structure`) — to verify feature tree state, parameter values, object properties
- Computed comparisons — e.g., `{ vertsBefore: N, vertsAfter: M, boundingBox: [...] }`

When studying whether an operation changes geometry, **always `filewrite` the evidence**. Do not rely on snapshots alone — they can mislead (auto-zoom, hidden geometry, back-face changes).

**Measure ALL geometry, not just the target.** When testing whether an operation changes element B, also measure element A. The solver may satisfy a constraint by changing the element you assumed was fixed. Example: EQUAL_LENGTH(fixedLine, freeLine) shrank the fixed line to match the free one — because FIXATION locks position/direction, not length. The script only checked the free line's length and concluded "no change", missing that the fixed line changed instead.

**Snapshot placement:** When your task involves 3D geometry (solids, booleans, fillets, etc.), see [Appendix: Snapshot Rules](#appendix-snapshot-rules) for camera orientation and geometry placement tips.

---

### Run it

```bash
node scripts/run.mjs workspace/training/<session>/scripts/01-basic.mjs \
  --outdir workspace/training/<session>
```

Read `files/<scriptName>.log` for console output and return values. Check `files/` for snapshots (PNGs) and data dumps (`.json`). **Evaluate both visual and numeric evidence.** If snapshots and data agree, you have a solid finding. If they disagree — a snapshot shows a change but data says nothing moved, or vice versa — that's a red flag: investigate before journaling. The most common cause is measuring the wrong element or missing a side effect.

---

### Write a journal entry

After each run, append a section to `journal.md`. Two tiers — **brief** (behavior matches docs) or **full** (surprising findings). See [Appendix: Journal Entry Format](#appendix-journal-format) for templates.

**Rules:**

- Every entry gets the script filename and a one-line result summary
- Snapshots MUST appear as markdown image embeds in a single-row table
- **Cross-check data and visuals.** Every finding should be supported by both numeric evidence (`filewrite` dumps, log values) and visual evidence (snapshots). When they agree, journal the finding. **When they disagree, do not journal — investigate.** Write another script, measure different elements, or re-examine your assumptions. A snapshot showing change + data showing none means you measured the wrong thing. Data showing change + identical snapshots means auto-scaling or view angle is hiding it.
- **📌 LLM doc:** flags only on full entries — these are your TODO list for Step 5

---

### Step 4A — API tasks

> Use this track when your task is prefixed with "Api study of" in PLAN.md.

**Script guidance:** Each script tests ONE parameter, variant, or behavior of the target API. Keep scripts small and specific.

```js
// API task — testing one API endpoint
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  console.log('[01] rectangle result:', r.result, 'maxLevel:', r.maxLevel)

  // Persist the full response for analysis
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rectangle-response')

  await snapshot('rectangle')
  return { partId }
}
```

**Return value** — return `{ partId }` at minimum, plus any IDs or values relevant to your test.

**Progression:** basic happy path → each optional parameter → parameter combinations → edge cases → error cases → update methods → cross-method combinations → realistic workflows.

**Coverage checklist** (check every 5 scripts and after the last script):

- [ ] The API has been called at least once successfully
- [ ] Every required parameter has been tested
- [ ] Key optional parameters have been exercised
- [ ] Every enum value / type variant has been exercised (if applicable)
- [ ] The corresponding `update*` / `delete*` method tested (if it exists)
- [ ] At least one realistic usage combining this API with its prerequisites
- [ ] Behavioral claims verified with data (`filewrite` dumps, log values) AND visual evidence (snapshots) — both must agree
- [ ] **Every question listed in the journal Goal section is answered in a named, specific script** (cite the script filename in the journal answer). Don't infer answers from snapshots that *imply* a thing — write a script that *measures* the thing.
- [ ] **Spatial claims** (origin, alignment, extent, dimension, range, default-position) — back each one with a numeric measurement: `getBrepGeometryByIndex` + `getGeometryPositions` for vertex coords, or `calculateMassProperties` for COG. Iso snapshots cannot verify spatial facts because of auto-zoom and projection ambiguity.

If not done, pick the next gap and loop back. **When to move on from a failing method:** If a method fails after 3 attempts with different parameter variations, log it as a doc discrepancy in the journal and move on. The failure itself is a finding.

---

### Step 4B — Conceptual tasks

> Use this track when your task is prefixed with "Study of" or any non-API prefix in PLAN.md.

**Script guidance:** Each script tests ONE question about the concept. Use APIs as probes — the APIs aren't the subject, the concept is. Call multiple different APIs to test whether behavior is universal.

```js
// Conceptual task — probing the protocol envelope
export default async function (api) {
  // Use different APIs as probes to study the concept
  const r1 = await api.v1.common.getAppVersion({})
  const r2 = await api.v1.common.getClassFileVersion({})

  return {
    envelopeKeys: Object.keys(r1),
    hasMessages: Array.isArray(r1.messages),
    maxLevel: r1.maxLevel,
    sameShape: Object.keys(r1).join() === Object.keys(r2).join(),
  }
}
```

**Return value** — return your findings as a structured object. There is no `partId` to return — return whatever answers your question.

**Progression:** observe the default/simple case → test each documented variant → probe edge cases → test cross-API consistency → synthesize rules.

**Coverage checklist** (check every 5 scripts and after the last script):

- [ ] Each stated question in the journal goal has been answered in a named, specific script with evidence — not inferred from snapshots
- [ ] At least one edge case or unexpected behavior has been probed
- [ ] Findings are grounded in observed server responses, not assumptions from docs
- [ ] The concept has been tested across at least 2 different APIs (to confirm it's universal, not API-specific)
- [ ] Key findings backed by `filewrite` data or logged return values AND visual inspection — both must agree
- [ ] Spatial claims (origin, alignment, extent, dimension, range) backed by vertex/COG measurement, not snapshots

## Step 5 — Write the LLM doc

**This is the deliverable.** The journal is working notes. The LLM docs are what persist and help future agents.

Review your journal. Every finding flagged with `📌 LLM doc:` feeds into this step.

### Where to write

Create or update: `knowledge/classcad-skill/references/<domain>/*.md`

- If the `references/<domain>/` folder does not exist, create it.
- If the `<apiName>.md` (or `generic.md`, if applicable) file does not exist, create it.
- If it already exists, update it with new findings.

**Example paths:**

- `references/common/getAppVersion.md`
- `references/part/extrusion.md`
- `references/solid/box.md`
- `references/sketch/constraint.md`

### What to write

These docs are written **for LLMs**, not humans. They complement the source API docs (`references/api/`) with practical, hard-won knowledge that an agent needs to actually use the API successfully. Include:

- **Summary** — what this API does in plain language (1–3 sentences).
- **Key parameters** — which matter most, what values to use, what to avoid. Don't repeat the full parameter table from the source docs — focus on what's non-obvious.
- **Return value** — what comes back and how to use it. Especially note if the result is an ID, array, VOID, etc.
- **Gotchas & dead ends** — silent failures, undocumented behavior, parameter combinations that break, misleading names.
- **Common errors** — error messages you hit and what they mean. What the fix is.
- **Usage hints** — practical tips: "always call X before Y", "pass `keepTools: true` or you lose the tool solid", "angles are in radians not degrees".
- **Prerequisites** — what must exist before calling this API (e.g., "requires a part created with `part.create`").
- **Working example** — a minimal, tested script that demonstrates correct usage.
- **Related APIs** — what pairs with this API, what to call next.

**Tone:** Direct, concise, opinionated. Write what an agent needs to know to get it right on the first try. Skip ceremony. See [Appendix: LLM Doc Template](#appendix-llm-doc-template) for a full example.

### When no API-specific file applies

For conceptual study tasks (protocol, data model, etc.), write the LLM doc to a generic.md in the relevant domain folder:

- `references/common/generic.md`
- `references/part/generic.md`

**If you found nothing new** (the existing LLM doc is already complete and correct): Write a `## Skill Updates` section at the end of `journal.md` explaining what you verified and why no changes are needed. Be specific — "nothing new" requires justification, not silence.

### If you cannot complete Step 5

- **Server unreachable / harness crash:** Write the LLM doc based on what you learned from the source docs and any scripts that did run. Mark clearly which sections are verified vs. unverified: `<!-- UNVERIFIED: could not connect to server -->`. The next session can pick up where you left off.
- **API does not exist or is broken:** Document that in the LLM doc — "this API returned error X on every attempt" is a valid and useful finding.
- **Conceptual task with no API to test:** Write the LLM doc from the source docs alone. This is expected for protocol/data-model tasks.

## Step 6 — Commit skill changes and write changes.md

If you created or modified any LLM doc files in Step 5, you **must** commit them inside the `knowledge/classcad-skill` submodule. This gives the next session a clean baseline for `git diff`.

**6a. Get the diff** (before committing):

```bash
cd knowledge/classcad-skill && git diff references/ && git status references/
```

For new (untracked) files, `git diff` won't show content. Stage them first to get a diff:

```bash
cd knowledge/classcad-skill && git add references/ && git diff --cached references/
```

**6b. Copy the diff** into `workspace/training/<session>/changes.md`. This is the record of what you changed — it must show actual `+`/`-` lines, not just a file listing.

**6c. Commit** inside the submodule:

```bash
cd knowledge/classcad-skill && git add references/ && git commit -m "train: <topic> — <one-line summary>"
```

Then return to the repo root. The outer repo will show the submodule pointer as modified — that's expected and correct.

**A session is complete when** Steps 6 and 7 are both done.

---

## Step 7 — Mark the task complete in PLAN.md

Open `workspace/PLAN.md` and change the task's `Studied` column from `[ ]` to `[✅]`.

**Before:**

```
| 1 | Api study of `common.getAppVersion` | [common.md](...) | [ ] |
```

**After:**

```
| 1 | Api study of `common.getAppVersion` | [common.md](...) | [✅] |
```

Use the Edit tool — find the exact row and replace `[ ]` with `[✅]`. Do **not** mark any other tasks. Only the one you trained on.

Then report:

- Which task was completed (step, category, task number and name)
- A one-line summary of what was learned
- Whether the next task has its prerequisites met (ready for next session)

---

## Step 8 — Append issues to workspace/TODO.md

If your session encountered **any** of the following, append them to `workspace/TODO.md`:

- Errors, warnings, or unexpected error codes
- Server crashes, hangs, or timeouts (especially 100% CPU / `kill -9` situations)
- Silent failures or no-ops (API accepts params without error but does nothing)
- Wrong, surprising, or undocumented behavior
- Doc discrepancies (docs say X, server does Y)
- Degenerate states (feature created but broken)

**Format:** Add a new entry under the appropriate severity section (CRITICAL / HIGH / MEDIUM / LOW). Each entry needs:

```markdown
### N. `<api>` — short title

- **Session:** `<session-folder-name>` (journal line ~N)
- **Error:** What happened (error message, behavior observed)
- **Trigger:** What input caused it
- **Workaround:** If known
```

Increment the entry number. If a new finding fits an existing severity section, add it there. If unsure, default to MEDIUM.

**If the session had no issues** — skip this step. Do not add a "no issues" entry.

---

## Completion checklist

Before declaring a session done, verify every item:

- [ ] Every journal entry that produced a snapshot embeds it as `![label](files/...png)`
- [ ] Every `📌 LLM doc:` flag in the journal has been addressed in Step 5 (LLM doc created/updated)
- [ ] `changes.md` exists with `+`/`-` diff lines, OR journal has `## Skill Updates` section justifying no changes
- [ ] Skill changes committed inside `knowledge/classcad-skill` submodule
- [ ] Journal goal/checklist has no uncovered items (or gaps are explicitly noted)
- [ ] The task row in `workspace/PLAN.md` is marked `[✅]`
- [ ] Any errors, hangs, surprises, or doc discrepancies appended to `workspace/TODO.md` (Step 8)

---

## Debugging

1. **Read the error** — ClassCAD errors are descriptive. They tell you exactly what's wrong.
2. **Check parameter names** — compare against `references/api/<domain>.md` character by character.
3. **Check ID types** — most failures come from passing the wrong ID. The source docs specify which ID each method expects.
4. **Check your own LLM docs** — if `references/<domain>/<apiName>.md` (or `generic.md`, if applicable) exists, prior findings may explain the issue.

---

<a name="appendix-snapshot-rules"></a>

## Appendix: Snapshot Rules

> Only relevant when your task involves 3D geometry (solids, booleans, fillets, chamfers, assemblies). Skip for protocol, sketch, or curve-only tasks.

**Renderer:** Per-body color palette, default isometric projection. **The renderer auto-scales to fit the viewport** — all geometry is normalized to fill the image regardless of absolute size. A 60³ cube and a 120³ cube produce identical-looking snapshots.

**Camera orientation:** `projectIso` rotates 45° around Y, then ~35.264° around X. World convention is right-handed, +X right / +Y forward / +Z up. Iso camera looks from roughly the (+X, +Y, +Z) corner toward the origin.

### View options

`snapshot('label', { view, zoom, lookAt })` selects the camera. Default is `'iso'`. Available views:

| view | Camera direction | Use when |
|---|---|---|
| `'iso'` (default) | corner view | overall shape, rough placement |
| `'top'` | looking -Z | hole or feature on the +Z (upper) face |
| `'bottom'` | looking +Z | feature on the -Z (lower) face |
| `'front'` | looking +Y | XZ side profile |
| `'back'` | looking -Y | opposite side profile |
| `'right'` | looking -X | YZ profile from +X side |
| `'left'` | looking +X | YZ profile from -X side |

`zoom` (default 1) is a multiplier on the auto-fit scale. `lookAt: [x, y, z]` puts that world point at screen center.

**Pick views deliberately, not by reflex.** Iso is enough for most tasks. Reach for a second view when iso is genuinely ambiguous — the test should be "what spatial fact am I trying to confirm?" not "let me try every angle."

**Auto-scaling implications:**

- **Uniform scaling is invisible.** Doubling all dimensions of a single body produces the same image. Before/after snapshots that only differ in size look identical.
- **To show a size change visually**, include a fixed-size reference body (e.g., a small cylinder that doesn't change). The reference body's relative size reveals whether the target body grew or shrank.
- **Shape changes are always visible.** Changing proportions (e.g., a cube → a tall box), adding/removing bodies, or cutting geometry always shows up because the silhouette changes.
- When comparing before/after snapshots, ask: "does the _shape_ differ, or only the _scale_?" If only scale differs, you need a reference object or must verify dimensions numerically (via `getExpression`, bounding box, etc.).

**Geometry placement tips:**

- Offset tools/cuts asymmetrically (shift in X _and_ Y, not just X)
- Use different-sized bodies (e.g., a 100³ box and a 60×40×80 box)
- Place cuts/additions where the silhouette changes (corners, off-center)
- For subtractions, position the tool so the cut is visible from the isometric view (not hidden inside or on the back face). If the cut goes through an axis aligned with iso (so it appears edge-on), add a `'top'` or `'front'` snapshot showing the through-hole circle on the broad face.
- Bias modified regions toward the viewer-facing side (lower X and/or higher Y/Z)
- The opposite side **(-X, +Y, -Z)** is the "back" of the iso view — easiest to accidentally hide geometry there
- If a before/after pair looks identical, assume view placement is wrong first: reposition, try a different `view`, and re-run
- **For parametric update tests:** always include a fixed-size reference body so scale changes are visible

**Assemblies:** instances render at their world transforms (the renderer composes `CC_ProductReference` / `CC_ProductReferenceET` `coordinateSystem` chains). Same-template instances share a color so you can spot duplicates in the iso view. If you see all bodies stacked at the origin, the snapshot was taken before the 2026-05-01 renderer port — invalid for spatial claims, redo.

---

<a name="appendix-journal-format"></a>

## Appendix: Journal Entry Format

**Brief entry** — behavior matches docs, nothing surprising:

```markdown
## 03 — symmetric extrusion

Script: `scripts/03-symmetric.mjs` — ✅ as documented, limit1=-30 limit2=30 produces centered box.
| ![result](files/03-symmetric-solid.png) |
|---|
```

**Full entry** — errors, doc discrepancies, unexpected behavior:

```markdown
## 04 — negative limit2 (unexpected)

Script: `scripts/04-neg-limit.mjs` — limit2=-10 silently produces no geometry. No error returned.

| ![before](files/04-before-solid.png) | ![after](files/04-after-solid.png) |
| ------------------------------------ | ---------------------------------- |

**Data:** maxLevel=0 (no error). Vertex count before: 36, after: 36 (unchanged — see `files/04-neg-limit-comparison.json`).

**Learned:** Negative limit2 is a silent no-op, not documented.
**📌 LLM doc:** Write to `references/part/extrusion.md` — document negative limit2 behavior.
```

> **Data AND pictures.** Every journal entry must cite numeric evidence (`filewrite` data, log values) alongside snapshots. Neither alone is sufficient. "The snapshots look the same" is not a finding — but "the data says no change while the snapshots clearly show a difference" is a red flag that demands a follow-up script before you journal a conclusion.

---

<a name="appendix-llm-doc-template"></a>

## Appendix: LLM Doc Template

````markdown
# part.extrusion

Creates an extrusion feature by sweeping a 2D profile along a direction vector.

## Prerequisites

- A part (`part.create`)
- A sketch with a sketch region, OR an entity injection with a shape

## Key Parameters

- `profile` — sketch region ID (from `sketch.sketchRegion`) or shape ID
- `direction` — `[x, y, z]` vector. Length matters — it defines the extrusion distance
- `limit1` / `limit2` — override direction length. Negative `limit2` is a **silent no-op** (no error, no geometry)

## Gotchas

- If `direction` is `[0,0,0]`, you get an unhelpful error about topology
- Passing a sketch ID instead of a sketch _region_ ID fails silently

## Working Example

```js
const partId = (await api.v1.part.create({})).result
// ... sketch setup ...
const extId = (
  await api.v1.part.extrusion({
    id: partId,
    profile: regionId,
    direction: [0, 0, 50],
  })
).result
```

## Related

- `part.updateExtrusion` — modify after creation
- `sketch.sketchRegion` — create the profile this consumes
````
