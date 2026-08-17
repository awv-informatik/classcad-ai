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

Construction curves are filtered out with a warning but no bail, leaving an **empty** `CC_SketchRegion`. That region
reaches `PreviewFeature` -> `RecalcProduct` -> `operationSequence.GenerateSequence`, whose **PreCheckVisitor** validates
the profile *before* building geometry: `PreCheckVisitor.cclass:1414` calls `CADH_CurvesFindSelfIntersections(region.GetCurveEntities())`
on the empty curve set. So the op never reaches solid construction — it wedges in the pre-build self-intersection scan.

**The actual hang (confirmed by `sample` of the wedged worker — hot frame `ClassCAD::CurveBuilder::CurvesFindSelfIntersections`
in libSMLibService):** `runtime/Source/SMLibService/c/CurveBuilder.cpp:1439`:

```cpp
for (ULONG i = 0 ; i<curves->GetSize()-1; i++){   // pairwise self-intersection scan
```

`ULONG` is `unsigned long`. For an empty array `GetSize()==0`, so `GetSize()-1` **underflows** to `ULONG_MAX`
(~1.8e19 on LP64 mac/Linux; ~4.29e9 on Windows LLP64 where `unsigned long` is 32-bit) — the loop runs effectively
forever, dereferencing out-of-bounds `GetAt(i)` and running an O(n^2) `GlobalCurveIntersect` per step. Not mac-specific:
the underflow is defined behavior on every platform (only the symptom — hang vs crash vs magnitude — varies by ABI /
allocator). Latent for every caller of this routine (`kernel.getSelfIntersections`, `CurveAnalyzer`, `GeometricalCalculations`).

## Fix (runtime root cause)

`CurveBuilder.cpp:1439` — underflow-safe loop bound (`classcad/runtime` branch `fix/construction-region-op-hang`, `aa9886a6e`):

```cpp
for (ULONG i = 0 ; i+1<curves->GetSize(); i++){
```

Empty / single-curve arrays now do zero iterations and return an empty intersection list (the documented contract).
Applied byte-safe (`perl`, not the Edit tool which re-encoded windows-1252 `é` in nearby comments); CurveBuilder.cpp
is CRLF + tab. Rebuilt `libSMLibService.dylib`.

**Two layers kept (per review).** The runtime fix alone is sufficient — with it, the self-intersection scan returns
cleanly and the precheck rejects the empty region with `maxLevel 51`; I verified that WITHOUT any cclass guard, and
per TODO-HOW-TO ("root cause returns a proper error -> skip the symptom patch") I initially removed the guard. But on
review the cclass `UpdateRegion` guard was kept as **defense-in-depth**: it bails the region ops FAST with a clear
message ("No usable (non-construction) geometry was selected for this operation.") before any region/precheck work.
Final landed state = **both**: runtime `aa9886a6e` (root cause) + cclasses `4a0726aa` (guard + regression test). The
guard-removal amend (`78ebc309`) was never pushed and is discarded.

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

Also re-ran the regression test + `BMTestSuite` (**397/0/0**) against the final state (runtime fix + test, **no**
cclass guard) — `files/testResult-BMTestSuite-final.xml`.

## Notes
- Root cause is **runtime C++** (`CurveBuilder.cpp` underflow), not cclass. First hypothesis ("kernel builds a solid
  from an empty region") was wrong — a `sample` of the wedged worker showed the spin is in the pre-build
  self-intersection scan. The kernel is never reached.
- `CurveBuilder.cpp` and `OperationsHelper.cclass` are **CRLF + windows-1252** — the Edit tool re-encodes them
  (corrupted `é` in Bézier comments on the first attempt); re-applied with `perl` byte-safe. `PartAPITest_v1.cclass`
  is LF (Edit tool fine there). (Runbook's "all cclass/cpp are LF" claim is inaccurate for these files.)
- **Branches (all LANDED / pushed):** `classcad/runtime` `aa9886a6e` (the runtime root-cause fix);
  `classcad/cclasses` `4a0726aa` (cclass guard + regression test — kept per review); `cc/classcad-skill`
  `7a5184d` merged to `master` (doc sweep: hangs -> error). All on branch `fix/construction-region-op-hang`
  except the skill docs which went to `master`.
