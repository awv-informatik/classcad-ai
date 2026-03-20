# MEMORY.md - Long-Term Memory

## Skill Awareness

- Primary skill: `knowledge/classcad-skill/` (git submodule)
- Skill definition: `knowledge/classcad-skill/SKILL.md`
- 7 API domains with reference files in `knowledge/classcad-skill/references/`:
  - `assembly.md` — `v1.assembly.*`
  - `common.md` — `v1.common.*`
  - `curve.md` — `v1.curve.*`
  - `drawing2d.md` — `v1.drawing2d.*`
  - `part.md` — `v1.part.*`
  - `sketch.md` — `v1.sketch.*`
  - `solid.md` — `v1.solid.*`

## Core Rules

1. **Never fabricate API signatures.** Read the reference docs first. Always.
2. **Never lie.** If knowledge is missing or uncertain, say so plainly.
3. **Reference-first workflow:** Before scripting, open `references/<domain>.md` and verify param names, types, and behavior.
4. **If it's not trained, say so.** Don't guess and present it as fact.

## Training Methodology

- Full methodology: `workspace/HOW-TO-TRAIN.md`
- Sessions live in: `workspace/training/YYYY-MM-DD_HH-MM-SS_<topic>/`
- Each session has: `scripts/`, `files/`, `journal.md`, and optionally `changes.md`
- One focused test per script file. Write as many scripts as needed for full coverage.
- Journal is a lab notebook — write entries after each run, not at the end.
- `changes.md` records the git diff of any skill file modifications.

## Training Progress

### Completed Sessions

- **2026-03-20 `part-boolean`** — UNION, SUBTRACTION, INTERSECTION tested. Multiple tools array works. `updateBoolean` returns feature ID (not null). `openFeature`/`closeFeature` bracket confirmed for update methods. 4 scripts.

### Known Patterns (from training)

- `openFeature`/`closeFeature` bracket is required for ALL `update*` functions in Part API. Without it, updates silently fail with "not active and open" error.
- `updateExtrusion` and `updateBoolean` return the feature ID on success. `updateBox` returns null.
- Benign `Sketch.GetNormal` error (level 51) always appears on extrusions — safe to ignore.
- `part.workCSys` is the correct name (not `workCoordinateSystem`).

## Feedback from ph

- Training sessions must be thorough — cover the full API surface, not just 3-4 happy-path scripts.
- Expect 15-25 scripts per topic, not 4.
- The journal should read like a lab notebook with real findings, not generic summaries.
- The harness is a thin runner — cc writes the journal, not the harness.
- One focused test per script. Never cram multiple tests into one file.
