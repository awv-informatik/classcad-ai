# Findings: PVS cavity Boolean investigation

## Scope and status

Read HOW-TO-TRAIN.md and workspace/TODO-HOW-TO.md. Used the repository harness and direct script sessions, never MCP. All experiments have isolated workers on ports 19094/19095 with a 40-second watchdog. Frozen production inputs live in inputs/. No skill or engine source was changed. The original cavity hang is reproduced; there are tested candidate workarounds, but the underlying engine defect is not yet proven or fixed. The complete base and shell are not validated by this investigation.

## Reproduction

The reduced native model constructs the real housing outer envelope and subtracts the first two bevelled cavity tools sequentially. The second subtraction, named cut_housing_shell_py_58_tool_1 (Python source housing_shell.py:58), hangs under suppressed emission. The worker remains busy in SMLib ManifoldBoolean / ImprintIntersections / UpdateFaces. This reproduces without MCP, independently of the separately fixed MCP socket timeout.

Run from this folder: `python3 run-case.py 04-suppressed.mjs 40`.
The runner starts and terminates only its own disposable worker. Harness exit code zero is not proof of success: inspect the script log and result artifacts.

## Controlled experiments

| Script | Change | Observed result |
|---|---|---|
| 01-reproduce | Normal emission; checkpoint before subtraction | Completed, 22.8 s |
| 02-uninstrumented | Normal emission; no checkpoint | Completed, 15.9 s |
| 03-full-base | Full base, normal emission | Cavity cuts pass; later intersection at housing_shell.py:61 fails |
| 04-suppressed | Suppress emission | Second cavity subtraction exceeds 40 s; worker sampled and stopped |
| 05-kernel-graphics | Suppressed profile, graphics enabled | Same timeout |
| 06-structure-only | Suppressed profile, structure enabled | Completed, 9.1 s |
| 07-simple-outer | Suppression, enclosing box replaces complex outer envelope | Completed, 1.5 s |
| 08-refresh-before | Suppression, one explicit tree refresh before second subtraction | Completed, 3.3 s |
| 09-native-chamfer | Native cavity chamfers instead of tapered-extrusion bevel construction | Returns CADH_SubSolidNew error at same subtraction |
| 10-refresh-repeat | Fresh-worker repeat of 08 | Same subtraction hangs; single refresh is NOT reliable |
| 11-structure-repeat | Fresh-worker repeat of 06 | Completed, 8.5 s |

Timings are whole harness subprocess durations, not Boolean-only timings. Logs and per-call timings are in files/.

## What this establishes

- The cavity problem is not solely the MCP connection timeout.
- Complex housing geometry is involved: the simple enclosing-box control passes.
- Emission/instrumentation changes the outcome. A successful instrumented run alone does not establish a fix.
- Keeping structure emission enabled passed both fresh-worker trials. This is a candidate operational workaround for this reduced case, not a general kernel repair.
- A single tree refresh passed once and hung once. Do not promote that as guidance.
- Changing to native cavity chamfers is not a successful substitute in this test.

## Source trace and remaining uncertainty

Traced CommandProcessorJsonV1.h -> CreateStructurePatches -> JSONPatchWorker::GetTreeSnapshot -> JSONService::ExportJSONHashmap -> RapidJsonHashmapWriter / BaseModelingWriterExtension. Tree serialization traverses database objects and geometry metadata inside a CCTransactionT scope. This identifies the code path whose execution correlates with success; it does not prove a particular side effect causes the hang. State initialization, object lifetime, allocation sensitivity, or numerical kernel behavior remain hypotheses. No speculative C++ or cclass patch was applied.

Before an engine patch: reduce the real outer envelope by removing feature groups; isolate transaction/serialization effects; reproduce repeatedly with consistent IDs and operands; then instrument the implicated Boolean/intersection path using TODO-HOW-TO.md. Preserve source encoding. A patch needs a repeatable failing regression and fresh-worker passing repeats.

## Geometry checks and limits

The reduced stage is a closed outer envelope minus two cavities, not the final split housing base. Original expectedVolume in result JSON still refers to the full production base and is NOT the reference for this reduced stage.

Independent OCC reference volume after two cuts: 105845.38899664066 mm3. Native results approximately 105847.37 mm3 (about 0.0019% greater). Native exported STEP imports as one valid OCC solid. OCC Boolean difference checks produced invalid negative volumes, so those results are explicitly rejected as evidence of exact geometric equivalence. Do not claim dimensional identity from the mass comparison alone.

## Recommendation for review

Keep the skill unchanged. The immediate candidate is to leave structure emission enabled during these sensitive cavity Booleans, then validate the full base and shell separately. The later full-base intersection failure is a distinct remaining problem and needs its own reduced case. Do not yet prescribe smaller chamfers or geometry changes as the cause or cure of this hang.

All skill files were compared against the frozen SHA-256 baseline after the experiments: no changed or added files.

## Superseding engine investigation

The later investigation established the actual stale-owner/use-after-free cause and the fatal-signal handling problem. See [cause.md](cause.md); the earlier emission-only conclusions above are historical and must not be treated as a reliable workaround.
