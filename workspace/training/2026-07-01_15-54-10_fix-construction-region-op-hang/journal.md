# Fix: region-based ops hang on an all-construction selection (TODO #173)

**Date:** 2026-07-01
**Category:** 💀 server hang. **Scope:** `part.extrusion` / `part.revolve` / `part.twist` (one root cause).

## Hypothesis (before touching code)

The construction-geometry study session (`2026-07-01_14-30-00_construction-geometry`) found `part.extrusion` on a
construction-only profile hangs the worker. Reading `OperationsHelper.UpdateRegion` suggested: construction curves
are soft-filtered (a warning), and an all-construction selection leaves the region empty but the op proceeds to
build/preview it -> hang. Extrusion, revolve and twist all call `UpdateRegion`, so all three should hang.

## Reproduction (timeout-guarded, on clean `main`)

Each repro wraps the call in an 8s JS `Promise.race` so the hang shows as `HUNG` instead of wedging the harness.
The worker still wedges server-side, so it was restarted between repros.

- `scripts/01-repro-extrusion.mjs` -> **HUNG** (part.extrusion did not return in 8000ms).
- `scripts/01-repro-revolve.mjs` -> **HUNG** (part.revolve, same). Confirms the sibling class.

(twist shares the identical `UpdateRegion` path; verified clean post-fix rather than reproduced pre-fix to save a
worker restart.)

## Root cause

`OperationsHelper.UpdateRegion` (cclasses/Source/BaseModeling/CCBaseModeling/OperationsHelper.cclass):

```
FORALL selectedIds selId DO
    IF selId.OBJ_IsA("CC_Curve") THEN
        IF selId.isConstruction = FALSE THEN ... add to sketchCurves
        ELSE OBJ_ErrorMessage("Selection of construction geometry is not allowed.", 2);  // warn + KEEP GOING
        ...
NEXT
IF !CADH_ObjectExists(operation.region) THEN operation.region = CreateRegion("SketchRegion", ...); ENDIF  // empty!
```

Construction curves are filtered out with a warning but no bail. An all-construction selection leaves `sketchCurves`
and `regions` empty, so an **empty** `CC_SketchRegion` is created and handed to `PreviewFeature` -> `RecalcProduct` ->
`operationSequence.GenerateSequence` -> the SMLib/C++ kernel tries to build a solid from an empty region and spins.
The `PreCheckVisitor` construction guard runs on an already-built region, too late to prevent the hang. The true
root cause (kernel not handling an empty region) is deep in SMLib (out of scope); the correct-scope fix is to stop
feeding the degenerate empty region to the kernel.

## Fix

One guard in the shared `UpdateRegion`, right after the filter loop and **before** the empty region is created
(covers extrusion + revolve + twist at once):

```
IF LEN(sketchCurves) = 0 AND LEN(regions) = 0 THEN
    OBJ_ErrorMessage("No usable (non-construction) geometry was selected for this operation.", 2);
    RETURN;
ENDIF
```

Byte-exact to the file's convention: CRLF endings, tab indentation, ASCII only, `=` (not `==`), `OBJ_ErrorMessage(.., 2)`
matching the sibling warning above it. This returns a proper error (non-empty `messages`, `maxLevel 51`) — not a
silent no-op — so no additional cclass symptom-patch is needed.

## Verification (fixed binary)

- `scripts/02-verify.mjs` (all six in one run, nothing hangs):
  - extrude / revolve / twist **construction-only** -> `ERROR maxLevel 51` ("No usable (non-construction) geometry
    was selected for this operation." + "There is no sketch region for Extrusion/Revolve/Twist"). No hang.
  - extrude / revolve / twist **normal** -> BUILT (solid ids 150 / 295 / 416). Happy path intact.
- **Original journal crash script** `2026-07-01_14-30-00_construction-geometry/scripts/03c-extrude-construction.mjs`
  re-run vs fixed binary -> returns `maxLevel 51`, clean messages, worker stays responsive.
  Log: `files/original-journal-rerun.log`.
- **Regression test** `PartAPITest_v1.testConstructionRegionOpsRejected` (asserts extrusion/revolve/twist each
  return `>= 1` message, i.e. error-not-hang) -> **PASS** (`<FailuresTotal>0</FailuresTotal>`). Pre-fix direction
  skipped per runbook (it would hang before the assert records).
- **Test suites:**
  - `BMTestSuite` (covers the change): **397 tests, 0 failures, 0 errors** — `files/testResult-BMTestSuite-after-fix.xml`.
  - `CADTestSuite`: 24 tests, 6 failures — all `ClassCadKeyApp` (crypto dylib, Windows-only). Identical on clean
    `main` (stash + re-run) — `files/testResult-CADTestSuite-after-fix.xml` vs `-master.xml`. Pre-existing baseline.
  - **Skipped** (BaseModeling-local change, no cross-domain effect): CommonTestSuite, BaseSystemTestSuite,
    FilerTestSuite, LGS3DServiceTestSuite, GeneralTestSuite, CocoRCompilerTestSuite, SystemClassesTestSuite.

## Notes
- The file `OperationsHelper.cclass` is CRLF + tab (the runbook's "all cclass files are LF" claim is inaccurate for
  this file). Inserted via `perl -0777` to write explicit CRLF; `PartAPITest_v1.cclass` is LF (Edit tool used there).
- Fix branch: `fix/construction-region-op-hang` in `cclasses` (one commit). Not pushed.
