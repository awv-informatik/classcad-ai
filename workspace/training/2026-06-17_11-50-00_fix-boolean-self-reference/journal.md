# Fix: boolean self-reference (target == tool) hangs the server

**TODO entries closed:** #3 (2D booleans), #4 (solid union/sub/intersect), #45 (solid merge) — all the same root cause.
**Original session:** `2026-04-07_22-00-00_2d-booleans` (entry 13, `scripts/13-same-target-tool.mjs`)

## Hypothesis

`curve.union2d` / `subtraction2d` / `intersection2d` and `solid.union` / `subtraction` / `intersection` / `merge` all funnel through a small set of C++ functions:

```
union/sub/intersect (2D + 3D)  → CADH_AddSolid/SubSolid/IntersectSolid
                                → SMLibService::BooleanOperationCADH(baseSolid, solid, op, ...)
merge                          → CADH_MergeSolid
                                → SMLibService::MergeSolid(baseSolid, solid, ...)
```

Both `BooleanOperationCADH` and `MergeSolid` open with:

```cpp
CADEntity* baseSolidEntity = CADEntity::GetFromId(baseSolid, true, true);
CADEntity* solidEntity     = CADEntity::GetFromId(solid, true, true);
```

When `target == tool` (same id), the two resolve to the **same `CADEntity*`**. The boolean
then runs against geometrically-coincident input. For 2D (`BooleanOperation2D`) two temp breps
are built from the *same* curve array and `DoBoolean2D` loops forever on the fully-coincident
faces; the 3D `DoBoolean` path loops the same way. 100% CPU, `kill -9` only.

## Repro

`scripts/01-repro.mjs` (env `CC_TEST` selects the variant). Against the merged main binary,
`CC_TEST=union2d` timed out at 8 s with the worker pinned at 100% CPU — confirmed the hang.

## Root cause + fix

The trigger is identical across all seven APIs: the same resolved entity used as both boolean
operands. Fixed at the shared C++ layer rather than in seven cclass procs — one robust guard
beats seven fiddly id-comparisons.

`classcad/runtime/Source/SMLibService/c/SMLibService.cpp`:

```cpp
// BooleanOperationCADH, right after resolving both entities:
if (baseSolidEntity == solidEntity) {
    throw new CCServiceException(_Tr(_T("A boolean operation requires distinct target and tool entities (the same id was given for both).")), _T(__FILE__), __LINE__);
}
// MergeSolid: same guard, "A merge operation requires distinct target and tool entities..."
```

Pointer comparison after `GetFromId` is the *most* robust check: it catches string-id `"5"`
vs real-id `5` vs any aliased ids that resolve to the same entity — cases a cclass-level
`param.target = param.tool` comparison would miss. The throw happens before any kernel mutation
and before the cclass `deleteShape`/`deleteSolid`, so the target survives intact.

### Why no cclass guards (deliberate)

The radius/interpolation fixes used cclass `OBJ_ErrorMessage` for clean code-1014 messages.
Here the root fix already returns a clear, non-hanging `maxLevel 51` error, and a cclass guard
would need error-prone id / array-membership comparison (7 procs) that is *less* robust than the
C++ pointer check. The thrown `CCServiceException` surfaces wrapped as
`"[Evaluation error in ... Function: CADH_AddSolid File: ... Line: 6211]"` — this is the
codebase's standard surface for C++ validation throws (cf. the existing "Could not create plane
with 3D curves" boolean error, thrown identically). Message text is clear and `maxLevel 51` is
detectable; chasing code-1014 parity via fragile cclass comparisons would add risk for cosmetic
gain. The C++ guard is the complete fix.

## Verification

### All seven self-reference variants (`scripts/01-repro.mjs`, one worker lifecycle each)

| API | Before | After |
|---|---|---|
| `curve.union2d` self | hang | maxLevel 51, "requires distinct target and tool" |
| `curve.subtraction2d` self | hang | maxLevel 51, same |
| `curve.intersection2d` self | hang | maxLevel 51, same |
| `solid.union` self | hang | maxLevel 51, same |
| `solid.subtraction` self | hang | maxLevel 51, same |
| `solid.intersection` self | hang | maxLevel 51, same |
| `solid.merge` self | hang | maxLevel 51, "merge requires distinct..." |

No worker hung; final CPU 0%.

### Original journal crash script (mandatory rerun)
`2026-04-07_22-00-00_2d-booleans/scripts/13-same-target-tool.mjs` against the fix:
both self-union and self-subtraction return `maxLevel 51` with the clear message, **target
shapes survive** (`s1`/`s2` still exist), worker 0% CPU. Captured in
`files/original-journal-rerun.log`.

### Inverse test (`scripts/02-inverse.mjs`)
Valid *distinct* booleans unaffected: `union2d` (distinct overlapping circles),
`solid.union` and `solid.subtraction` (distinct boxes) all return `maxLevel 31`, no messages.
The guard fires only on self-reference.

### Regression tests (CCTestCase)
- `CurveAPITest_v1.test2dBooleanSelfReference` — union2d/sub2d/intersect2d self all rejected; target shape survives.
- `SolidAPITest_v1.testBooleanSelfReference` — union/sub/intersect/merge self all rejected; target solid survives.

Both wrap each call in `LOG_OpenTryCatchScope`/`LOG_CloseTryCatchScope` and assert `LEN(res.messages) >= 1`. Both pass.

### Full suite

| Suite | Tests | Failures | Errors | Notes |
|---|---|---|---|---|
| BMTestSuite | 390 | 0 | 0 | +2 new regression tests (was 388) |
| CommonTestSuite | 45 | 0 | 0 | |
| FilerTestSuite | 2 | 0 | 0 | |
| LGS3DServiceTestSuite | 16 | 0 | 0 | |
| GeneralTestSuite | 18 | 0 | 0 | |
| CocoRCompilerTestSuite | 59 | 0 | 0 | |
| SystemClassesTestSuite | 1 | 0 | 0 | |
| CADTestSuite | 24 | 4 | 2 | pre-existing ClassCadKeyApp (missing `CryptoDevServiced.dylib`) |
| BaseSystemTestSuite | 224 | 0 | 1 | pre-existing **environmental**: `IOService1Test.testImportExport_DbReferences` fails because `./data/Test/Input/ImportExport/Box.ofb` is absent on disk (other ImportExport files exist, that one doesn't). The error is in `io.importOfb` opening a missing file — cannot be caused by a boolean-operation guard. Not in this fix's blast radius. |

Per-suite XMLs in `files/`.

## Commit

Branch `fix/boolean-self-reference-hang` (runtime only):
- `classcad/runtime` — guards in `BooleanOperationCADH` + `MergeSolid`.
- `classcad/cclasses` — two regression tests (`test2dBooleanSelfReference`, `testBooleanSelfReference`).

Not pushed. ph reviews and lands.
