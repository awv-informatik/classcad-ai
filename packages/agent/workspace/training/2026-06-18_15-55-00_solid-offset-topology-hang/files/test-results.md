# Test results — boolean partial-failure cleanup fix

Binary: `runtime/output/arm64-osx-clang/release/classcad-cli`, cclasses with the fix
(`fix/boolean-partial-failure-cleanup`, per-call try-catch version).

## Full per-suite sweep

| Suite | Tests | Errors | Failures | Notes |
|---|---|---|---|---|
| **BMTestSuite** | **391** | **0** | **0** | 390 prior + new `testBooleanPartialFailureCleanup`; the changed code |
| CADTestSuite | 24 | 2 | 4 | all 6 = `ClassCadKeyApp` crypto/licensing — **pre-existing** |
| CommonTestSuite | 45 | 0 | 0 | |
| BaseSystemTestSuite | 224 | 1 | 0 | `IOService1Test.testImportExport_DbReferences` — `Box.ofb` missing fixture, **pre-existing** |
| FilerTestSuite | 2 | 0 | 0 | |
| LGS3DServiceTestSuite | 16 | 0 | 0 | |
| GeneralTestSuite | 18 | 0 | 0 | |
| CocoRCompilerTestSuite | 59 | 0 | 0 | |
| SystemClassesTestSuite | 1 | 0 | 0 | |

No new regressions. The only failures are the two documented pre-existing ones (crypto licensing, missing fixture), unrelated to solid booleans.

## Targeted repro verification (each in a fresh worker)

- `repro-step-export-hang.mjs` — partial-failure subtraction then `common.save(STP)`: **save returns** maxLevel 51 (was: 100% CPU hang). Worker 0% CPU.
- `2026-04-15_09-00-00_solid-offset/scripts/13-multiple-booleans.mjs` (original crash script) — **completes**: offset returns maxLevel 31, both before/after snapshots render, worker 0% CPU.
- `probe-state.mjs` — after the partial-failure subtraction: target box valid (vol 69644, kept c1's hole); tools c1/c2/c3 all cleaned up (maxLevel 51, no shell). On unfixed main c3 was still live (vol 3927).

## Note — pre-existing bug found (NOT this fix), logged as TODO #150

`probe-keeptools.mjs` / `probe-tangent.mjs`: repeating a boolean on a degenerate/tangent tool
leaves the session corrupted so later boolean calls fail with a spurious `"... id = VOID ..."`
(code 1001). Reproduces identically on pristine `main` (SolidAPI reverted) — independent of this
fix, independent of `keepTools`, independent of per-loop vs per-call scoping.
