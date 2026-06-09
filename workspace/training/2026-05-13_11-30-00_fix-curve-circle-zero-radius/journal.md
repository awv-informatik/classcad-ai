# Fix: curve.circle — radius <= 0 hangs server

**TODO entry:** `### 1. [ ] 💀 curve.circle — radius <= 0 hangs server` (workspace/TODO.md line 199)
**Original session:** `2026-03-31_00-00-00_curve-circle` (journal entry 08)

## Hypothesis

The classcad `circle` proc in `cclasses/Source/BaseModeling/api/CurveAPI_v1.cclass` (line ~687)
passes the user-supplied radius directly into the C++ helper
`CADH_CreateEllipticArc(VOID, centerPos, {1,0,0}, normal, 0, 2*PI, r, r)`. With `r <= 0` the
SMLib ellipse construction enters an infinite loop deep in the C++ side (we never see a
return, CPU stays at ~99%, only `kill -9` recovers).

The C++ dispatch (`SMLibService.cpp:3222 eCreateEllipticArc → CreateEllipse`) does no
range check, and reaching into SMLib to add one risks breaking other call sites
(`arcByCenterRadAngle`, `ellipse`, `ellipticArc`, plus `SolidHelper`, `DxfService`).
The minimal, safe fix is a cclass-level guard inside the `circle` proc — same shape as
the existing planarity guard in `polyline2d` (line 567) which already uses
`OBJ_ErrorMessage(..., ERR:NOTWELLDEFINED)`.

## Repro (before fix)

`scripts/01-repro.mjs` — wrap `curve.circle({ radius: 0 })` and `radius: -15` in a 10s
JS-side timeout so a hang surfaces as a timeout rather than wedging the harness.

Result against unfixed binary:

```
[repro] calling circle with radius=0...
[repro] radius=0 FAILED: timeout 10000ms: radius=0
[repro] calling circle with radius=-15...
[repro] radius=-15 FAILED: timeout 10000ms: radius=-15
```

`ps aux` showed the worker at 98.8% CPU after the first call. Confirmed `kill -9` to
recover (`files/01-repro-repro-results.json`, `files/01-repro.log`).

## Root cause

`Source/BaseModeling/api/CurveAPI_v1.cclass:715-727` — the proc's `DoJob` iterates over
`lineParams` and unconditionally calls `CADH_CreateEllipticArc` with `radius, radius`.
No validation exists between `PrepareAPIParams` (which only enforces "must be a real")
and the SMLib call.

## Fix

`Source/BaseModeling/api/CurveAPI_v1.cclass` — wrap the SMLib call in an `IF
lineParam.radius <= 0` guard that emits an `ERR:NOTWELLDEFINED` error message instead.
Pattern copied from the polyline2d planarity check in the same file. The fix preserves
batch-call semantics: an invalid item is skipped with an error message; valid items in
the same batch still produce circles.

Diff (10 lines, indentation matches surrounding tabs):

```
+		IF lineParam.radius <= 0 THEN
+			OBJ_ErrorMessage("The parameter \"radius\" must be greater than 0.", 2, FALSE, ERR:NOTWELLDEFINED);
+		ELSE
 			ent = CADH_CreateEllipticArc(VOID, lineParam.centerPos, {1,0,0}, lineParam.normal, 0,
 				C:PI * 2, lineParam.radius, lineParam.radius);
-			@CurveHelper.AppendToShape(lineParam.id, ent);
+			@CurveHelper.AppendToShape(lineParam.id, ent);
+		ENDIF
```

(`solid.subtraction`, `solid.union`, `solid.merge`, `curve.interpolationCurve`, the 2D
booleans, etc. — neighbouring TODO entries — show the same shape of bug elsewhere. Each
needs its own per-API guard. Out of scope for this TODO; one fix per session.)

## Verification

### Harness-level
- `scripts/01-repro.mjs` against the fixed binary: both calls now return cleanly with
  `maxLevel=51`, code `1014`, message `"The parameter \"radius\" must be greater than
  0."`. `files/01-repro-repro-results.json`, `files/01-repro.log`.
- `scripts/02-inverse.mjs` — valid `radius: 20` still returns `maxLevel=31, messages=[]`;
  batch `[{r:5}, {r:0}, {r:7}]` reports one error and processes the valid items.
  `files/02-inverse-inverse-results.json`.

### .cclass regression test
Added `testCircleInvalidRadius` to `CurveAPITest_v1.cclass` (placed after `testCircle`).
Three assertions: `radius=0` produces an error message, `radius=-5` produces an error
message, batch with one bad item reports an error and a follow-up valid call still
creates extrudable geometry. Run standalone:

```
classcad-cli execute --class UnitTesterHeadless --func PerformSingleTestFunc \
  -p CurveAPITest_v1 -p testCircleInvalidRadius -p /tmp/curve-circle-test.xml
```

Result: 1/1 pass, 0 failures (`files/testResult-testCircleInvalidRadius.xml`). The test
necessarily skips the "fails on master" inverse direction — without the fix the test
process would hang in SMLib before the assertion framework could capture a failure.
That's the bug; the repro script already evidences it.

### Full-suite run

| Suite                    | Tests | Failures | Errors | Notes |
|--------------------------|-------|----------|--------|-------|
| BMTestSuite              | 378   | 0        | 0      | includes the new `testCircleInvalidRadius` |
| CommonTestSuite          | 45    | 0        | 0      | |
| BaseSystemTestSuite      | 219   | 0        | 0      | |
| FilerTestSuite           | 2     | 0        | 0      | |
| LGS3DServiceTestSuite    | 16    | 0        | 0      | |
| GeneralTestSuite         | 18    | 0        | 0      | |
| CocoRCompilerTestSuite   | 59    | 0        | 0      | |
| CADTestSuite             | 24    | 4        | 2      | pre-existing — all ClassCadKeyApp license/crypto tests, same failures on master (`testResult-CADTestSuite-master.xml`); needs `CryptoDevServiced.dylib` which the local build doesn't produce on macOS |
| SketcherTestSuite        | —     | —        | —      | suite name does not exist; Sketcher tests live inside `BMTestSuite` (already green) |

All per-suite result XMLs are in `files/`. The CAD failures are unrelated to the fix —
verified by stashing the fix, running `CADTestSuite` against master, and observing the
identical four `ClassCadKeyApp` test names fail with the same dlopen error.

## Underlying cause (deeper fix)

The cclass guard above patches the symptom — it stops `v1.curve.circle` from
reaching the hung code path. But `radius <= 0` reaches the same hang via
`arcByCenterRadAngle`, `ellipticArc`, `ellipse`, `SolidHelper`, and `DxfService`
DXF import. Tracing one layer down:

`Source/SMLibService/c/CurveBuilder.cpp:213-243` (8-arg `CreateEllipse`):

```cpp
IwBSplineCurve* bSplineCurveA;                              // uninitialised
IwBSplineCurve::CreateEllipseSegment(..., bSplineCurveA);   // status discarded
...
curves->Add(bSplineCurveA);
```

SMLib's `IwBSplineCurve::CreateEllipseSegment`
(`deps/smlib/NMTLib/src/IwBSplineCurve.cpp:2207-2225`) validates with
`LE_ZERO_ER(dRadiusAtXAxis); LE_ZERO_ER(dRadiusAtYAxis);` — on failure it
early-returns `IW_ERR_INVALID_INPUT` without initialising the out-parameter.
The wrapper:
- Doesn't initialise `bSplineCurveA` before the call.
- Discards the `IwStatus` return.
- Adds the uninitialised pointer to the `IwTArray<IwCurve*>`.

Downstream tessellation walks the garbage and gets stuck in a loop. The hang
isn't *inside* SMLib — SMLib refused cleanly. It's in code that runs on top
of the garbage SMLib pretended not to produce.

Same anti-pattern at line ~151 (5-arg `CreateEllipse`) calling
`IwEllipse::CreateCanonical`, which sets the out-pointer to `NULL` and
returns `IW_ERR` when the nurb can't be built.

### Fix (runtime)

`Source/SMLibService/c/CurveBuilder.cpp` — initialise the out-parameters,
capture `IwStatus`, return the empty `IwTArray` on failure:

```cpp
IwBSplineCurve* bSplineCurveA = NULL;
IwStatus status = IwBSplineCurve::CreateEllipseSegment(..., bSplineCurveA);
...
if (status != IW_SUCCESS || bSplineCurveA == NULL) {
    return curves;   // empty; callers tolerate empty curve arrays
}
curves->Add(bSplineCurveA);
```

Same shape applied to the 5-arg `CreateCanonical` overload.

### Verification (broader)

`scripts/03-cpp-fix-other-apis.mjs` exercises the previously-latent paths:

| Call (radius ≤ 0)                                | Before C++ fix | After |
|---|---|---|
| `arcByCenterRadAngle({ radius: 0 })`             | hang | returns maxLevel 31 |
| `arcByCenterRadAngle({ radius: -3 })`            | hang | returns maxLevel 31 |
| `ellipticArc({ radius1: 0, radius2: 5 })`        | hang | returns maxLevel 31 |
| `ellipticArc({ radius1: 5, radius2: 0 })`        | hang | returns maxLevel 31 |
| `ellipse({ radius1: 0, radius2: 0 })`            | hang | returns maxLevel 31 |
| `ellipse({ radius1: -2, radius2: 3 })`           | hang | returns maxLevel 31 |
| `circle({ radius: 10 })` (sanity)                | works | maxLevel 31, geometry created |

The unguarded APIs (everything except `circle`) now silently no-op on
invalid radius rather than hanging. That's defense-in-depth — not a great
UX, but no longer a hang. Future cclass guards (one per API) can upgrade
those to proper error messages, but that's separate work.

Full test suite re-run against the C++-fixed binary: identical to the
cclass-only run (BMTestSuite 378/378 etc., CADTestSuite same 4 pre-existing
license/crypto failures). Per-suite XMLs saved as
`testResult-<suite>-after-cpp-fix.xml`.

## Is the cclass guard still needed after the root fix?

Tested empirically: stashed the cclass guard in `circle`, restarted worker
with only the runtime fix active, re-ran `scripts/01-repro.mjs`:

```
[repro] calling circle with radius=0...
[repro] radius=0 returned. maxLevel=31 messages=[]
[repro] calling circle with radius=-15...
[repro] radius=-15 returned. maxLevel=31 messages=[]
```

No hang, no 100% CPU — but also no error message. The call returns success
shape (`maxLevel 31, messages: []`) while creating no geometry. **Silent
no-op**, which is hard for a caller to detect or debug.

Per TODO-HOW-TO.md: "If the root fix just produces a silent no-op… the
symptom patch is still worth adding." So the cclass guard stays, and is
extended to every sibling API hitting the same root cause.

## Sibling sweep

The runtime fix protects every entry point into `CurveBuilder::CreateEllipse`.
The cclass guard for `circle` only fixes one of them. To make the
user-facing UX consistent across all four affected curve APIs, the same
guard was added to:

- `arcByCenterRadAngle` (radius <= 0)
- `ellipticArc` (radius1 <= 0 OR radius2 <= 0)
- `ellipse` (radius1 <= 0 OR radius2 <= 0)

Each got a regression test in `CurveAPITest_v1.cclass`. Post-sweep
`scripts/03-cpp-fix-other-apis.mjs` confirms all six previously-latent
patterns now return `maxLevel 51, code 1014` with proper error messages.

`SolidHelper` and `DxfService` paths through `CADH_CreateEllipticArc` are
not user-facing APIs — the runtime fix is sufficient there (they get
empty-curve-array results when given degenerate input, which the surrounding
code already tolerates).

## Commits

Three commits across two repos, same branch name `fix/curve-circle-zero-radius-hang`:

- `classcad/runtime`  `3c5db6448` — root cause: `IwStatus` check in `CurveBuilder::CreateEllipse`. Closes the hang at the source.
- `classcad/cclasses` `2b5dd88c` — cclass guard for `v1.curve.circle` (user-facing error).
- `classcad/cclasses` `d2f21984` — same guard swept to `arcByCenterRadAngle`, `ellipticArc`, `ellipse` + three regression tests.

None pushed. ph reviews and lands. After landing, the parent classcad
repo's submodule pointers for `cclasses` and `runtime` will need to be
bumped — ph handles that.

### Test suite (post-sweep)

| Suite | Tests | Failures | Errors |
|---|---|---|---|
| BMTestSuite | 381 | 0 | 0 |
| BaseSystemTestSuite | 219 | 0 | 0 |
| CommonTestSuite | 45 | 0 | 0 |
| CocoRCompilerTestSuite | 59 | 0 | 0 |
| GeneralTestSuite | 18 | 0 | 0 |
| LGS3DServiceTestSuite | 16 | 0 | 0 |
| FilerTestSuite | 2 | 0 | 0 |
| SystemClassesTestSuite | 1 | 0 | 0 |
| CADTestSuite | 24 | 4 | 2 | pre-existing ClassCadKeyApp, same as master |

BMTestSuite gained 3 tests (378 → 381) for the new regressions. Per-suite
XMLs in `files/testResult-<suite>-after-sweep.xml`.
