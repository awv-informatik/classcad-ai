# Fix: curve.interpolationCurve — empty / single-point / duplicate-point hangs

**TODO entry:** `### 2. [ ] 💀 curve.interpolationCurve — duplicate points hang server`
**Original session:** `2026-04-07_00-00-00_interpolationCurve` (entries 06 single-point, 07/13 duplicates)

## Hypothesis

`v1.curve.interpolationCurve` routes to `CADH_CreateInterpolationCurve` → `SMLibService::CreateInterpolationCurve` → `CurveBuilder::CreateInterpolationCurve` → `IwBSplineCurve::InterpolatePoints` with `IW_IT_CHORDLENGTH` parameterization. Chord-length math computes parameter values from `1 / distance(P[i], P[i+1])` style — zero distance → division by zero → NLIB's knot-fitting algorithm spins forever.

The C++ wrapper (`CurveBuilder.cpp:2065-2080`) does no input validation:
- Doesn't check `n >= 2` before handing off to SMLib (so empty + single-point also hang).
- Doesn't check the `IwStatus` return from `InterpolatePoints` before dereferencing `pCurve` (`status |= pCurve->ReparametrizeWithArcLength()` would null-deref if SMLib failed).
- Doesn't validate that consecutive points are distinct.

## Repro

`scripts/01-repro.mjs` against unfixed main: `two-consecutive-duplicates` timed out at 8s, worker stuck at 99.6% CPU. `kill -9` to recover. (Subsequent cases blocked because worker wedged.) See `files/01-repro.log`.

## Root cause + fix

### Runtime (`classcad/runtime/Source/SMLibService/c/CurveBuilder.cpp:2065`)

Three checks added to `CurveBuilder::CreateInterpolationCurve`:

```cpp
if (n < 2) {
    return nullptr;
}
// ... build sPts ...
for (ULONG i = 1; i < n; i++) {
    if (sPts[i].DistanceBetween(sPts[i - 1]) < IW_EFF_ZERO) {
        return nullptr;
    }
}
// ...
IwStatus status = IwBSplineCurve::InterpolatePoints(...);
if (status != IW_SUCCESS || pCurve == nullptr) {
    return nullptr;
}
status |= pCurve->ReparametrizeWithArcLength();
return pCurve;
```

`IW_EFF_ZERO` is SMLib's standard numeric-tolerance constant (`1.0e-12`, from `iwos_math.h:39`).

The wrapper at `SMLibService::CreateInterpolationCurve` already handled a null return cleanly (`if (curve)` branch returning a null id), so callers see no garbage propagation.

### cclass guard (`classcad/cclasses/Source/BaseModeling/api/CurveAPI_v1.cclass`)

Tested the C++ fix alone first: hangs gone, but the cclass-side `AppendToShape` got handed a null and emitted the cryptic `"Uninitialized UnknownPTR"` error from `CADH_CreateInterpolationCurve`. That's a worse UX than a clean error, so a cclass-level guard was still warranted (per the runbook's "is the symptom patch still needed?" check).

Added a `FORALL`-based loop using `hasPrev`/`hasDup` flags (cclass doesn't have `BREAK`, and `RETURN` inside `FORALL` produced a `Stacksize < 0` codegen error). Two error messages:
- `n < 2` → `"The parameter \"points\" must contain at least 2 points."`
- consecutive duplicates → `"The parameter \"points\" must not contain consecutive duplicate points."`

Both use code 1014, level 51 (`ERR:NOTWELLDEFINED`) — consistent with the radius fixes from branch `fix/curve-circle-zero-radius-hang`.

### Verification

`scripts/01-repro.mjs` against fixed binary:

| Input | Before | After |
|---|---|---|
| 4 pts with 2 consecutive duplicates | hang | code 1014 "consecutive duplicate points" |
| 3 identical points | hang | code 1014 "consecutive duplicate points" |
| `[]` empty | hang | code 1014 "must contain at least 2 points" |
| 1 point | hang | code 1014 "must contain at least 2 points" |
| Valid 3-point baseline | works | maxLevel 31, no messages |

`scripts/02-inverse.mjs`: 2-point line, 8-point smooth curve, and 3-entry batch (one of which has a duplicate) all behave correctly. The batch reports the one error, valid entries still create geometry.

## Other lessons learned this session

- **cclass uses `=` for equality, not `==`.** First attempt used `pt:x == prev:x` — compiler emitted a `CodeGen::SimulateStackDepth: Stacksize < 0!` error. Switching to `=` fixed it.
- **`.cclass` files are windows-1252 / ISO-8859-1.** First attempt had a UTF-8 em-dash (`—`, bytes `e2 80 94`) in a comment. The cclass loader rejected the entire proc with a generic compile error.
- **Both pitfalls are now noted in TODO-HOW-TO.md** so future sessions don't repeat.

## Test suite (post-fix)

| Suite | Tests | Failures | Errors |
|---|---|---|---|
| BMTestSuite | 388 | 0 | 0 |
| BaseSystemTestSuite | 219 | 0 | 0 |
| CommonTestSuite | 45 | 0 | 0 |
| CocoRCompilerTestSuite | 59 | 0 | 0 |
| GeneralTestSuite | 18 | 0 | 0 |
| LGS3DServiceTestSuite | 16 | 0 | 0 |
| FilerTestSuite | 2 | 0 | 0 |
| SystemClassesTestSuite | 1 | 0 | 0 |
| CADTestSuite | 24 | 4 | 2 | pre-existing ClassCadKeyApp (same as master) |

BMTestSuite gained 1 (387→388) for `testInterpolationCurveInvalidPoints`. Per-suite XMLs at `files/testResult-<suite>-after-fix.xml`.

## Sibling sweep

Checked `CurveBuilder::CreateBezierCurve` (the journal noted bezierCurve "tolerates duplicates"): it uses `CreateNurbsCurve` directly with explicit knot/control-point construction — no chord-length parameterization, so duplicates don't cause division by zero. Confirmed it isn't affected. `CreateNurbsCurve` has its own (commented-out) input validation but isn't exposed to the bug.

No sibling APIs need cclass guards.

## Commits

Two commits on branch `fix/curve-interpolationCurve-duplicate-points-hang` in two repos:

- `classcad/runtime`  — root cause: validation + IwStatus check in `CurveBuilder::CreateInterpolationCurve`.
- `classcad/cclasses` — user-facing error messages + regression test.

Neither pushed. ph reviews and lands.
