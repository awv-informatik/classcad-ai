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

## Feedback from ph

- Training sessions must be thorough — cover the full API surface, not just 3-4 happy-path scripts.
- Expect 15-25 scripts per topic, not 4.
- The journal should read like a lab notebook with real findings, not generic summaries.
- The harness is a thin runner — cc writes the journal, not the harness.
- One focused test per script. Never cram multiple tests into one file.
- **Don't get stuck in the scripting loop** — finish journal + skill updates + changes.md promptly, not after being asked.

## Training Log

### 2026-03-20: Booleans (Deep)
- Session: `workspace/training/2026-03-20_13-00-00_booleans/`
- Scripts: 20 (01–20, with b/c variants for retries)
- Coverage: `v1.part.boolean` (all 3 types, all params, indices, chaining, errors, cross-method) + `v1.part.updateBoolean` (type/name/target/tools changes, open/close workflow, wrong feature type dispatch)
- Key findings:
  - Non-overlapping INTERSECTION → ERROR "blank solid was removed" (UNION/SUBTRACTION silent)
  - Same feature as target+tool: succeeds with no error
  - `updateBoolean` returns feature ID (not null), dispatches to open feature's actual type
  - `indices` are 0-based for both target and tools
  - Boolean features can be chained, patterned, and queried for brep edges
  - `linearPattern` uses `targets` (plural array) + `dir1.references` is required
- Skill updates: 2 AGENT NOTEs updated in `references/part.md`
