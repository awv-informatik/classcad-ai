# How to Train

You are training the ClassCAD API skill by writing test scripts, running them against a live server, and recording what you learn in a journal. The journal is YOUR writing — your exploration, your reasoning, your findings.

**Golden rule: read the reference docs before writing any code. Do not guess parameter names, ID types, or return values.**

## Repo layout

```
knowledge/
  classcad-skill/            ← THE SKILL you are training (SKILL.md + references/*.md)
  classcad-cli-skill/        ← WebSocket protocol (SKILL.md + protocol.md)
  classcad-api/              ← raw API docs from @classcad/api-js (read-only reference)
scripts/                     ← harness code (do not edit)
workspace/
  training/                  ← your training sessions
```

The 7 API domains and their reference files (all under `knowledge/classcad-skill/references/`):

| Domain    | Reference      | Namespace        |
| --------- | -------------- | ---------------- |
| Assembly  | `assembly.md`  | `v1.assembly.*`  |
| Common    | `common.md`    | `v1.common.*`    |
| Curve     | `curve.md`     | `v1.curve.*`     |
| Drawing2D | `drawing2d.md` | `v1.drawing2d.*` |
| Part      | `part.md`      | `v1.part.*`      |
| Sketch    | `sketch.md`    | `v1.sketch.*`    |
| Solid     | `solid.md`     | `v1.solid.*`     |

If a reference file is unclear, cross-check with `knowledge/classcad-api/<domain>.md` (upstream API docs).

## The harness

The harness (`node scripts/run.mjs`) is a thin test runner. It connects to ClassCAD, runs your script, and prints results to stdout:

```bash
node scripts/run.mjs <script-path> --outdir <session-folder>
```

It prints each API call with its result inline:

```
[run] Connected
[run] scripts/01-basic.mjs
  ✓ v1.part.create → 4 (20ms)
  ✓ v1.sketch.create → 52 (4ms)
  ✓ v1.sketch.rectangle → [58,64,70,76] (9ms)
  ✓ v1.part.extrusion → 96 (13ms)
    ❌ [Evaluation error in Sketch.GetNormal:CCObject can not be opened...]
  📸 after-extrusion: files/01-basic-after-extrusion-solid.png
[run] partId=4 eifId=null solidIds=[]
[run] Done
```

Snapshots (`snapshot('label')`) save PNGs + STEP + OFB to `files/`. The harness clears the drawing and disconnects after each run.

**The harness does NOT write your journal.** You write it.

---

## Step 1 — Read the reference docs

Read `knowledge/classcad-skill/references/<domain>.md` for every method you plan to test. Study the documentation in this order:

1. **Method signatures and parameter tables** — exact parameter names, types, and which are optional.
2. **Return value structure** — what the method gives back and how to use it.
3. **Related methods in the same domain** — understand the neighborhood.
4. **`AGENT NOTE` blocks** — supplementary findings from prior training. These are helpful but secondary. The raw docs are the ground truth; notes are annotations on top.

If a reference file is unclear, cross-check with `knowledge/classcad-api/<domain>.md` (upstream API docs).

## Step 2 — Create the session folder and journal

```
workspace/training/YYYY-MM-DD_HH-MM-SS_<topic>/
  scripts/      ← your test scripts (one focused test per file)
  files/        ← harness output (PNGs, STEP, OFB)
  journal.md    ← YOU write this — your exploration log
  changes.md    ← YOU write this IF you modify skill files (must contain git diff)
```

Create `journal.md` with a title, date, and a goal section. The goal should list every method and parameter you intend to cover — this becomes your checklist. Write it after reading the reference docs so it reflects the actual API surface.

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
- How does boolean interact with patterns (tools with indices)?
```

## Step 3 — Write, run, and journal (the loop)

This is an iterative loop. For each test:

### 3a. Write a focused script

Each script tests ONE question or behavior. Keep scripts small and specific — but write as many as you need. A training session for `part.boolean` might have 10–20 scripts. A session covering `sketch.line` + `sketch.arc` + `sketch.circle` might have 30+. The goal is full coverage of every parameter, mode, and edge case in the topic's API surface.

```js
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'Test' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (
    await execute({
      'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] }],
    })
  ).result

  await snapshot('rectangle')
  return { partId }
}
```

**`execute()`** — sends one API call: `{ 'v1.domain.method': [{ params }] }`. Returns `{ result, messages, maxLevel }`.

**`snapshot('label')`** — captures current state as PNG + STEP + OFB into `files/`.

**Return value** — return `{ partId }` at minimum, or any object. The harness prints it.

### 3b. Run it

```bash
node scripts/run.mjs workspace/training/<session>/scripts/01-basic.mjs \
  --outdir workspace/training/<session>
```

Read the stdout output. Look at snapshot PNGs in `files/`.

### 3c. Write a journal entry

After each run, append a section to `journal.md`. Write what you tried, what happened, what you learned:

```markdown
## Trying basic extrusion (UP)

Script: `scripts/01-up.mjs` — create rectangle, sketchRegion, extrude UP with limit2=60.

**Results:**

- `extrusion` returned feature ID 96
- ❌ level-51 `Sketch.GetNormal` error appeared but extrusion succeeded — benign
- Solid rendered correctly: 80×50×60 box

![after extrusion](files/01-up-after-extrusion-solid.png)

**Learned:** The `GetNormal` error is always present on extrusions. Safe to ignore.
```

The journal should read like a lab notebook. Include:

- What you were testing and why
- The script filename
- Key return values and whether they matched the docs
- ❌ Errors and ⚠️ warnings — with your interpretation of what they mean
- Snapshot images (`![label](files/filename.png)`)
- What you learned or what surprised you
- What to try next

### 3d. Keep going — cover the full API surface

A training session is not done after 3–4 scripts. You are building a **complete understanding** of every method, parameter, and behavior in the topic. Go back to the reference docs frequently — every parameter you haven't tested is a gap.

**Progression for each method:**

1. **Basic happy path** — does it work at all with minimal required params?
2. **Every parameter** — test each optional parameter individually. What does `taper` do? What does `symmetric` change? What does `name` accept? If the docs list 8 parameters, you should have tested all 8.
3. **Parameter combinations** — do parameters interact? Does `symmetric: true` change how `limit1`/`limit2` work? Does `direction` affect `taper`?
4. **Edge cases and boundaries** — zero values, negative values, very large values, empty arrays, duplicate IDs. What breaks? What silently succeeds?
5. **Error cases** — wrong ID types, missing required params, invalid enum values. What error messages does ClassCAD return? Are they descriptive?
6. **Update methods** — if there's an `updateX` paired with the method, test it: open feature, change each parameter, close feature. What does it return? Can you change type after creation?
7. **Combinations with related methods** — how does this method interact with nearby features? Boolean after extrusion? Pattern after boolean? Fillet on a filleted edge? These cross-method interactions are where the most valuable findings live.
8. **Realistic workflows** — build something non-trivial that a real user would make. A bracket, a housing, a plate with holes. This tests the method in context and often reveals issues that isolated tests miss.

**Coverage checklist — before ending a session, verify:**

- [ ] Every method in the topic has been called at least once
- [ ] Every documented parameter has been tested
- [ ] Every enum value / type variant has been exercised (e.g., all three boolean types, all extrusion directions)
- [ ] `update*` and `delete*` methods tested if they exist
- [ ] At least one cross-method combination tested
- [ ] At least one realistic multi-step workflow

If the reference docs describe 6 methods with 5 parameters each, expect 15–25 scripts, not 4.

Name scripts sequentially: `01-up.mjs`, `02-down.mjs`, `03-symmetric.mjs`, `04-taper.mjs`, etc.

## Step 4 — Update the skill

**This is the deliverable.** The journal is your working notes. The skill files are what persist and help future agents.

After your exploration, review your journal and update the skill docs. Update when:

- The docs are wrong or misleading
- You found critical undocumented behavior (gotchas, edge cases, actual return structure)
- An existing `AGENT NOTE` is incorrect

Do not skip this step. If you ran tests and learned nothing new, say so explicitly in the journal — but verify that claim first.

**Where to write:**

- **`knowledge/classcad-skill/SKILL.md`** — generic cross-domain findings (conventions, patterns, architectural insights).
- **`knowledge/classcad-skill/references/<domain>.md`** — domain-specific findings (method behavior, return values, edge cases).

**How to write:**

- **Edit in place.** Find the exact location where the API or topic is documented. Add, update, or remove information right there. Never summarize at the top or append at the bottom.
- Use `AGENT NOTE` blocks placed directly after the relevant method or paragraph:
  ```markdown
  > **AGENT NOTE (trained YYYY-MM-DD):** <verified finding>
  ```
- If an existing note is wrong, fix or remove it in place.

**Record the diff:**

```bash
cd knowledge/classcad-skill && git diff references/ SKILL.md
```

Copy the output into `workspace/training/<session>/changes.md`. Only create `changes.md` if you actually modified skill files. It must contain the raw diff.

---

## Debugging

1. **Read the error** — ClassCAD errors are descriptive. They tell you exactly what's wrong.
2. **Check parameter names** — compare against the reference docs character by character.
3. **Check ID types** — most failures come from passing the wrong ID. The reference docs specify which ID each method expects.
4. **Cross-reference** `knowledge/classcad-api/<domain>.md` if the skill reference is ambiguous.
