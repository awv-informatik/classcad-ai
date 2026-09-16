# Actual cause: stale proto-edge owners, then a swallowed fatal signal

## Conclusion

The cavity Boolean exposes a use-after-free in SMLib 8.12. ResolveOverlappingProtoEdges removes and replaces temporary edges, but refreshes only the first coincident face that owns them. Another face retains the deleted edge. UpdateFaces later dereferences that stale edge and faults. ClassCAD worker catches fatal signals but returns from the handler without terminating, repeatedly resuming the fault and presenting it as a CPU-bound hang.

This is source- and runtime-backed, not inferred merely from emission settings.

## Exact evidence

1. `files/13-debug-lldb.txt`: EXC_BAD_ACCESS at IwProtoTopology.cpp:4804, reading `raEdgeDefs[kk]` in UpdateFaces. Address is invalid. The optimized debug-symbol build retained the original source and optimization.
2. `files/16-debug-worker.log`, lines 1292-1301:

```
PVS_OVERLAP_OWNER pe=0x7b22fe5f40 pf=0x7b2296abc0
PVS_OVERLAP_OWNER pe=0x7b22fe5f40 pf=0x7b22a525a0
PVS_REFRESHED_OWNER pf=0x7b2296abc0
PVS_EMPTY_PE 0x7b22fe5f40
PVS_DELETE_PE 0x7b22fe5f40
...
PVS_STALE_PE 0x7b22fe5f40 pf=0x7b22a525a0 index=3
PVS_STALE_PE 0x7b22fe5f40 pf=0x7b22a525a0 index=3
```

The second owner is demonstrably left unchanged and later reads the deleted edge. A passing run still emits the stale-reference evidence; apparently successful runs are not safe evidence that this defect is absent.

3. Kernel source: `runtime/deps/smlib/NMTLib/src/IwProtoTopology.cpp`, ResolveOverlappingProtoEdges, original lines approximately 5794-5820. The loop removes old coincident edges from a face, sets bReplaceCoinPE, then breaks. After deleting the overlapping edges, replacement edges are attached only to that one pPF. UpdateFaces assumes its face-owned edge references remain valid.
4. Worker source: `runtime/Source/ClassCADInstance/commands/WorkerCommand.h`, lines 23-36 and 60-65. SIGSEGV, SIGILL, SIGFPE, and SIGABRT are installed on Terminate, which acts only on SIGINT/SIGTERM and otherwise returns. This explains the repeating signal-handler samples. Do not attempt normal application cleanup in a synchronous fatal-signal handler.

## Causal candidate test

Candidate: collect ALL affected face owners, remove old edge references from all of them, and attach replacement edges to each collected owner. No null-pointer guard or arbitrary timeout is involved.

- `files/proposed-owner-fix.patch`: small candidate without instrumentation; not applied.
- `files/candidate-with-diagnostics.patch`: exact tested variant including lifetime tracing.
- `files/lifetime-instrumentation.patch`: diagnostic tracing before candidate changes.
- Fresh-worker trials 18, 19, 20: all completed with emission suppressed, about 3.2 seconds each, both owners refreshed, zero stale-reference detections.
- Volumes: 105847.3687935, 105847.6563521, 105847.3676728 mm3. They are close, not identical. This is not proof of exact geometry equivalence or manufacturing readiness.
- Detailed machine-readable checks: `files/cause-verification.json`.

The paired trace (two owners / only one refreshed / stale pointer) and candidate trace (both owners refreshed / no stale pointer) establish the bookkeeping defect. Allocation-sensitive use-after-free explains why serialization can mask it; the exact allocator behavior was not instrumented, and structure emission should not be treated as a reliable fix.

## Proposed production work, pending review

1. Kernel: finish the all-owner bookkeeping fix, review replacement membership and related edge-removal paths, and add a regression that asserts no face references a removed proto-edge. Validate topology and geometry, not only API success.
2. Worker: keep graceful handling for SIGINT/SIGTERM; restore default fatal-signal behavior or use a minimal terminating policy. A kernel crash must terminate the worker rather than retry a faulting instruction indefinitely. Test in a child process.
3. Re-run the original reduced cases and the complete base/shell. The later full-base intersection error remains separate and was not addressed here. Run relevant kernel/Boolean suites before landing either fix.

No production fix is promoted or committed. The original source bytes and original kernel binary were restored after the experiment. The SMLib diagnostic branch is `codex/pvs-cavity-cause` with a clean working tree; patches and a candidate binary are retained in this training folder. Skill SHA-256 baseline remains unchanged.

## Build notes

The normal target build attempted a dependency reconfigure after the SDK changed. Stopped only the owned rebuild and used existing compile/link commands for IwProtoTopology.cpp and NMTLib, with debug symbols and MACOSX_DEPLOYMENT_TARGET=26.0 to match the existing PCH. Original optimization was retained. The default worker was not stopped; all tests used disposable alternate-port workers. Debug and candidate binaries were never installed as final fixes.
