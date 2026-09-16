# SMLib 9 follow-up trials — 2026-09-16

## Scope and configuration

User authorized three diagnostic trials, retaining SMLib 9, with no deep edits until discussion. Default `.classcad.ini` now selects the three 9.x services; macOS arm64 CMake preset enables the 9.x library/service targets. Six built 9.x libraries were installed beside the 8.x libraries. Default worker restarted on 9094/9095. Original INI saved in `inputs/default-before-smlib9.ini`.

Kernel: SMLib 9.4.3, `runtime/deps/smlib-sm` at `3948a9ec9c1353f2c3dc0f0742fd5b64785e7709` (matches `origin/awv`). Runtime remains on multi-client. No kernel fixes, production housing changes, or skill edits in this pass. Diagnostic builder copies and options reside only in this training workspace. Existing delivered assembly was not overwritten.

## Trial 1 — original housing intersections

- `24-original9-Base.mjs` and `24-original9-Upper_shell.mjs`: original mounting-stock intersection at housing_shell.py:61 still fails with `Intersection.CreateCCOperation`, `CADH_IntersectSolidNew`, CADH_Service.cpp:2754, “What to do in that case?”. Harness exit 0 does not imply script success; see `*-harness.log` and calls JSONL.
- `25-camera9.mjs`: retain the existing mounting-stock regrouping solely to get past that first failure; disable the camera clipping regrouping in a diagnostic builder copy. The original camera-seam intersection at housing_shell.py:100 still produces a non-manifold solid, detected at the following union (`F617_common_housing_shell_py_100`, error1121).
- `26-current9-Base.mjs` and `26-current9-Upper_shell.mjs`: both build with the already-existing Boolean regroupings, in 28.078 and 21.124 seconds respectively (whole harness timing). Native OFB, STEP, measurement JSON and snapshots saved under files/26-current9-*.

Conclusion: 9 does not eliminate these two modeling failures. Keep the existing equivalent Boolean regroupings. This does not identify a new root cause or justify a kernel patch yet.

## Trial 2 — measurements

FreeCAD/OpenCascade independently reads each exported STEP as one valid solid. Trimmed tessellation bounds at 0.05 mm deflection match the Python reference to floating-point precision (maximum extent difference below 1e-12 mm). This is not proof of identical geometry.

| Part | Native volume mm³ | Native difference from Python | STEP/OCC volume mm³ | STEP difference from Python |
|---|---:|---:|---:|---:|
| Base | 41550.607554 | -0.000824% | 41591.844592 | +0.098420% |
| Upper_shell | 26505.421907 | +0.008287% | 26529.454843 | +0.098967% |

The STEP/OCC discrepancy remains around +0.1%, similar to SMLib 8. Native volume agreement is much closer. Cause not established: export representation, integration tolerance, and actual surface differences are still hypotheses, not conclusions. Evidence: `files/smlib9-geometry-check.json`, `scripts/validate-smlib9.py`, native result JSONs. Production geometry-check.json unchanged.

## Trial 3 — baseline tests

- PartAPITest_v1: 45 tests, 44 passed, one error. Previously on 8: 43 passed, two errors/failures. `testGetSolidProperties` now passes.
- BMTestSuite: initial 60-second run timed out while still progressing. Repeat with a 240-second cap completed in **77.656 seconds**, exit0: **397 tests, 396 passed, one error**. Previously the suite crashed with exit139 on both original and patched 8.
- Both remaining errors are the same existing `PartAPITest_v1.testTwist2` test-method compilation error. A successful process exit is not an all-tests-pass result.
- Evidence: `files/smlib9-PartAPITest_v1.xml`, `files/smlib9-BMTestSuite-extended.xml`, matching logs and run JSON.

## Discussion before further changes

Stay on 9. Preserve the two current Boolean regroupings. If authorized next, prioritize a small reproduction of each intersection failure and a controlled native-vs-STEP volume comparison; inspect the testTwist2 compilation error separately. No skill recommendation should be promoted to a rule until those investigations establish the cause. Skill hashes checked against `inputs/skill-baseline.json`: unchanged.
