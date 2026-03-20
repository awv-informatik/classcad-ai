# How to Train

You are training the ClassCAD API skill by writing test scripts, running them against a live server, and recording what you learn. Your deliverable is **updated skill files** — AGENT NOTEs added to `knowledge/classcad-skill/` where the docs are wrong, misleading, or incomplete. The journal is your working notebook. The skill updates are the point.

**Golden rule: read the reference docs before writing any code. Do not guess parameter names, ID types, or return values.**

**Pipeline: Read → Script → Run → Journal → Apply to skill files → changes.md**

Every training session follows this pipeline. Steps 1–3 are preparation and exploration. Steps 4–5 are the deliverable. When you find something the docs get wrong, miss, or underexplain, you edit it **in place** in `knowledge/classcad-skill/SKILL.md` or `knowledge/classcad-skill/references/<domain>.md` — at the exact location where that method or topic is documented. Then you record the git diff in `changes.md`. A session is not complete until you have either applied your findings to the skill files and written `changes.md`, or explicitly justified in the journal why no updates are needed.

---

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

Read `knowledge/classcad-skill/references/<domain>.md` for every method you plan to test. Study in this order:

1. **Method signatures and parameter tables** — exact parameter names, types, and which are optional.
2. **Return value structure** — what the method gives back and how to use it.
3. **Related methods in the same domain** — understand the neighborhood.
4. **`AGENT NOTE` blocks** — supplementary findings from prior training. Helpful but secondary. The raw docs are ground truth; notes are annotations on top.

If a reference file is unclear, cross-check with `knowledge/classcad-api/<domain>.md` (upstream API docs).

## Step 2 — Create the session folder and journal

```
workspace/training/YYYY-MM-DD_HH-MM-SS_<topic>/
  scripts/      ← your test scripts (one focused test per file)
  files/        ← harness output (PNGs, STEP, OFB)
  journal.md    ← your exploration log (written during Step 3)
  changes.md    ← skill update diff (written during Step 5)
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

Each script tests ONE question or behavior. Keep scripts small and specific — but write as many as you need. If the reference docs describe 6 methods with 5 parameters each, expect 15–25 scripts, not 4.

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

**Snapshot design rule:** The renderer uses an isometric projection with per-body coloring (each body gets a distinct color). To make before/after differences visible:
- Offset tools/cuts asymmetrically (e.g., shift in X *and* Y, not just X)
- Use different-sized bodies (e.g., a 100³ box and a 60×40×80 box)
- Place cuts/additions where the silhouette changes (corners, off-center)
- For subtractions, position the tool so the cut is visible from the isometric view (not hidden inside or on the back face)

**Return value** — return `{ partId }` at minimum, or any object. The harness prints it.

### 3b. Run it

```bash
node scripts/run.mjs workspace/training/<session>/scripts/01-basic.mjs \
  --outdir workspace/training/<session>
```

Read the stdout output. Look at snapshot PNGs in `files/`.

### 3c. Write a journal entry

After each run, append a section to `journal.md`:

```markdown
## Trying basic extrusion (UP)

Script: `scripts/01-up.mjs` — create rectangle, sketchRegion, extrude UP with limit2=60.

**Results:**

- `extrusion` returned feature ID 96
- ❌ level-51 `Sketch.GetNormal` error appeared but extrusion succeeded — benign
- Solid rendered correctly: 80×50×60 box

![after extrusion](files/01-up-after-extrusion-solid.png)

**Learned:** The `GetNormal` error is always present on extrusions. Safe to ignore.

**📌 Skill update:** GetNormal error is undocumented — add AGENT NOTE to extrusion section.
```

The journal should read like a lab notebook. Include:

- What you were testing and why
- The script filename
- Key return values and whether they matched the docs
- ❌ Errors and ⚠️ warnings — with your interpretation
- Snapshot images (`![label](files/filename.png)`)
- What you learned or what surprised you
- What to try next
- **📌 Skill update flags** — when you discover something that belongs in the skill files, mark it with `📌 Skill update:` right there in the journal entry. This is your TODO list for Step 4.

**Before/after snapshots:** When you take before and after snapshots, compare them and reason about the visual result. Do the images show a visible difference? Does the difference match what the operation should have produced? If the before and after look identical, either the geometry was set up poorly for visual verification, or something unexpected happened. If you're not satisfied, write another script with better geometry. The snapshots are evidence — if the evidence is ambiguous, gather better evidence.

### 3d. Cover the full API surface

**Progression for each method:**

1. **Basic happy path** — does it work at all with minimal required params?
2. **Every parameter** — test each optional parameter individually. If the docs list 8 parameters, test all 8.
3. **Parameter combinations** — do parameters interact?
4. **Edge cases and boundaries** — zero values, negative values, very large values, empty arrays, duplicate IDs.
5. **Error cases** — wrong ID types, missing required params, invalid enum values.
6. **Update methods** — if there's an `updateX` paired with the method, test it: open feature, change each parameter, close feature.
7. **Combinations with related methods** — boolean after extrusion? Pattern after boolean? These cross-method interactions are where the most valuable findings live.
8. **Realistic workflows** — build something non-trivial that a real user would make.

**Coverage checklist — before moving to Step 4, verify:**

- [ ] Every method in the topic has been called at least once
- [ ] Every documented parameter has been tested
- [ ] Every enum value / type variant has been exercised
- [ ] `update*` and `delete*` methods tested if they exist
- [ ] At least one cross-method combination tested
- [ ] At least one realistic multi-step workflow

Name scripts sequentially: `01-up.mjs`, `02-down.mjs`, `03-symmetric.mjs`, etc.

## Step 4 — Update the skill files

**This is the deliverable.** The journal is working notes. The skill files are what persist and help future agents.

Review your journal. Look for every `📌 Skill update` flag and every finding where the docs are wrong, misleading, or missing critical information. Then edit the skill files:

**Where to write:**

- **`knowledge/classcad-skill/references/<domain>.md`** — domain-specific findings (method behavior, return values, edge cases).
- **`knowledge/classcad-skill/SKILL.md`** — cross-domain findings (conventions, patterns, architectural insights).

**How to write:**

- **Edit in place.** Find the exact location where the API or topic is documented. Add, update, or remove information right there. Never summarize at the top or append at the bottom.
- Use `AGENT NOTE` blocks placed directly after the relevant method or paragraph:
  ```markdown
  > **AGENT NOTE (trained YYYY-MM-DD):** <verified finding>
  ```
- If an existing note is wrong, fix or remove it in place.

**If you found nothing new:** Write a `## Skill Updates` section at the end of `journal.md` explaining why — which existing AGENT NOTEs you verified, what you tested that matched the docs exactly, and why no changes are needed. Be specific. "Nothing new" is a valid outcome but requires justification, not silence.

## Step 5 — Write changes.md

If you modified any skill files in Step 4, run:

```bash
cd knowledge/classcad-skill && git diff references/ SKILL.md
```

Copy the full output into `workspace/training/<session>/changes.md`. This is the record of what you changed and the proof that Step 4 happened.

**A session is complete when:**
- `changes.md` exists with the diff of your skill updates, OR
- `journal.md` ends with a `## Skill Updates` section explaining why no changes were needed.

There is no third option. One of these two must be true before you stop.

---

## Debugging

1. **Read the error** — ClassCAD errors are descriptive. They tell you exactly what's wrong.
2. **Check parameter names** — compare against the reference docs character by character.
3. **Check ID types** — most failures come from passing the wrong ID. The reference docs specify which ID each method expects.
4. **Cross-reference** `knowledge/classcad-api/<domain>.md` if the skill reference is ambiguous.
