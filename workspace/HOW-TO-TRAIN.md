# How to Train

You are training the ClassCAD API skill by writing test scripts, running them against a live server, and recording what you learn. Your deliverable is **updated skill files** — AGENT NOTEs added to `knowledge/classcad-skill/` where the docs are wrong, misleading, or incomplete. The journal is your working notebook. The skill updates are the point.

**Golden rule: read the reference docs before writing any code. Do not guess parameter names, ID types, or return values.**

**Pipeline: Read → Script → Run → Journal → Apply to skill files → changes.md**

Every training session follows this pipeline. Steps 1–3 are preparation and exploration. Steps 4–5 are the deliverable. When you find something the docs get wrong, miss, or underexplain, you edit it **in place** in `knowledge/classcad-skill/SKILL.md` or `knowledge/classcad-skill/references/<domain>.md` — at the exact location where that method or topic is documented. Then you record the git diff in `changes.md`. A session is not complete until you have either applied your findings to the skill files and written `changes.md`, or explicitly justified in the journal why no updates are needed.

---

## Relevant repo layout

```
knowledge/
  classcad-skill/            ← THE SKILL you are training (SKILL.md + references/*.md)
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

This is an iterative loop. Each iteration: write a script → run it → journal the result → check if you're done. **Stop iterating** when the coverage checklist below is satisfied, or when you've written 25 scripts — whichever comes first. If you hit the cap, move to Step 4 with what you have and note any gaps in the journal.

### 3a. Write a focused script

Each script tests ONE question or behavior. Keep scripts small and specific — write as many as you need to satisfy the coverage checklist.

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

**Snapshot design rule:** The renderer uses a fixed isometric projection with per-body coloring (each body gets a distinct color). To make before/after differences visible:

- Offset tools/cuts asymmetrically (e.g., shift in X _and_ Y, not just X)
- Use different-sized bodies (e.g., a 100³ box and a 60×40×80 box)
- Place cuts/additions where the silhouette changes (corners, off-center)
- For subtractions, position the tool so the cut is visible from the isometric view (not hidden inside or on the back face)

**Viewer-facing rule (from `scripts/render-direct.mjs`):** solids are rendered with `projectIso` (rotate 45° around Y, then ~35.264° around X). Depth is `d = (-x + y + z)/√3`, and larger `d` is closer to camera.

- Think of the camera as viewing from roughly **(-X, +Y, +Z)** toward the origin.
- The opposite side **(+X, -Y, -Z)** is the “back” side and easiest to hide cuts/fillets on.
- When testing cuts/fillets/chamfers, bias geometry so the modified region is on the viewer-facing side (lower X and/or higher Y/Z).
- If a before/after pair looks unchanged, assume view placement may be wrong first: reposition and re-run.

**Return value** — return `{ partId }` at minimum, or any object. The harness prints it.

### 3b. Run it

```bash
node scripts/run.mjs workspace/training/<session>/scripts/01-basic.mjs \
  --outdir workspace/training/<session>
```

Read the stdout output. Look at snapshot PNGs in `files/`.

### 3c. Write a journal entry

After each run, append a section to `journal.md`. This is an example template:

```markdown
## Trying basic extrusion (UP)

Script: `scripts/01-up.mjs` — create rectangle, sketchRegion, extrude UP with limit2=60.

**Results:**

- `extrusion` returned ...
- ❌ level-51 `Sketch.GetNormal` error appeared ...
- Solid rendered correctly: ...

| ![before extrusion](files/01-up-before-extrusion-solid.png) | ![after extrusion](files/01-up-after-extrusion-solid.png) |
|---|---|

**Learned:** The `GetNormal` error is always present on extrusions. Safe to ignore.

**📌 Skill update:** GetNormal error is undocumented — add AGENT NOTE to extrusion section.
```

The journal should read like a lab notebook. Every entry must include:

- What you tested and why
- The script filename
- Key return values (did they match docs?)
- Errors/warnings with your interpretation
- **Snapshot images as markdown embeds** — if the script produced snapshots, they MUST appear in the journal entry. If no snapshot was taken (e.g., error-only test), note that explicitly. **When there are multiple images (e.g., before/after), embed them in a single row using a markdown table, not stacked vertically:**
  ```markdown
  | ![before](files/01-before-solid.png) | ![after](files/01-after-solid.png) |
  |---|---|
  ```
- What you learned
- **📌 Skill update:** flags for findings that belong in the skill files — these are your canonical TODO list for Step 4

**Before/after snapshots:** Compare them and reason about the visual result. If before and after look identical, either the geometry was set up poorly or something unexpected happened. If the evidence is ambiguous, write another script with better geometry.

### 3d. Check: am I done?

**After each journal entry**, check the coverage checklist. If all boxes are satisfied, move to Step 4. If you've written 25 scripts, move to Step 4 regardless.

**Coverage checklist:**

- [ ] Every method in the topic has been called at least once
- [ ] Every documented parameter has been tested
- [ ] Every enum value / type variant has been exercised
- [ ] `update*` and `delete*` methods tested if they exist
- [ ] At least one cross-method combination tested
- [ ] At least one realistic multi-step workflow

If not done, pick the next gap and loop back to 3a. Follow this progression for each method: basic happy path → each optional parameter → parameter combinations → edge cases → error cases → update methods → cross-method combinations → realistic workflows.

**When to move on from a failing method:** If a method fails after 3 attempts with different parameter variations, log it as a doc discrepancy in the journal and move on. Do not keep retrying — the failure itself is a finding.

Name scripts sequentially: `01-up.mjs`, `02-down.mjs`, `03-symmetric.mjs`, etc.

## Step 4 — Update the skill files

**This is the deliverable.** The journal is working notes. The skill files are what persist and help future agents.

Review your journal. Every finding that needs a skill update should already be flagged with `📌 Skill update:` — work through that list. Then edit the skill files:

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

## Completion checklist

Before declaring a session done, verify every item:

- [ ] Every journal entry that produced a snapshot embeds it as `![label](files/...png)`
- [ ] Every `📌 Skill update:` flag in the journal has been addressed in Step 4
- [ ] `changes.md` exists with diff, OR journal has `## Skill Updates` section justifying no changes
- [ ] Journal goal/checklist has no uncovered items (or gaps are explicitly noted)

---

## Debugging

1. **Read the error** — ClassCAD errors are descriptive. They tell you exactly what's wrong.
2. **Check parameter names** — compare against the reference docs character by character.
3. **Check ID types** — most failures come from passing the wrong ID. The reference docs specify which ID each method expects.
4. **Cross-reference** `knowledge/classcad-api/<domain>.md` if the skill reference is ambiguous.
