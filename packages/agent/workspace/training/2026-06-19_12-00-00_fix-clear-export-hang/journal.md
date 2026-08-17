# TODO #64: `common.clear({keepIds})` + STEP/OFB export hangs on partially-cleared state

**TODO entry:** #64 — after `clear({ keepIds: [partId] })`, exporting to STEP/OFB hangs the server (100% CPU, `kill -9`).
**Original session:** `2026-04-15_21-00-00_common-clear` (entries 04, 11).
**Fix:** classcad-runtime `cf971f66d` + classcad-cclasses `c73d032c`, both on branch `fix/step-export-dangling-entity-hang` (NOT pushed).

## Hypothesis

Same export-hang *family* as TODO #48: the STEP exporter dereferences a freed kernel pointer and
fault-loops. #48 fixed it at the boolean source (booleans no longer leave consumed-tool shells).
#64 reaches the same dangling-entity state by a different route — `clear({keepIds})` keeps a
container but frees its child geometry, leaving the kept container referencing removed entities.
The durable fix (the user chose this, "option 2") is to harden the exporter so it skips a
removed/freed entity instead of dereferencing it — closing the whole family regardless of source.

## Repro

`scripts/01-repro.mjs`: part + eif + box, `clear({ keepIds: [part] })`, then
`common.save({ format: 'STP' })`. On main the save never returns — worker pegs at 98-99% CPU,
`kill -9` only. (Confirmed against current main before fixing.)

## Root cause (located by stack sampling + instrumented build)

`sample` on the hung worker bottomed out in `ServiceCallFunc -> __dynamic_cast` (fault-loop in
`libSMLibExpressService`). An instrumented build logging the dispatch `id` showed the failing path
is the **assembly writer**, not the flat one: `common.save` STP builds an assembly
(`eCreateAssemblyContext` -> `eCreateAssembly` -> `eAddEntityReference`), and the fault is in
`AssemblyContext::AddEntityReference` (`runtime/Source/SMLibExpressService/c/AssemblyContext.cpp:241`).

The instrumented diagnostic printed, for the box after `clear`:
`objExists=0 rawCAD=0x0`. So the box is **gone from the live DB** (`CCId::ObjExists()==false`,
`GetCADEntity()==NULL`), yet it is still referenced as an entity to export. The original code did:

```
CADEntity * entity = dynamic_cast<CADEntity*>(entityId->GetCADEntity());  // GetCADEntity()==NULL -> entity==NULL
if( !entity->HasKernelEntity() ){                                         // virtual call on NULL -> fault loop
```

i.e. it called the virtual `HasKernelEntity()` on a **null** `entity` (no null-check), and
`HasKernelEntity()` itself is just `return m_kernelEntity != nullptr` — no liveness validation. The
flat writer (`ExportToStream`, `SMLibExpressService.cpp:784`) has the same shape: it reads the
kernel of a stale transaction shell with no liveness check.

Why massprops on the same box returns a clean error instead of hanging: it resolves through the
live-DB path and its kernel access throws a *catchable* exception; the exporter's raw `dynamic_cast`
/ null virtual-call faults uncatchably and the signal handler retries forever.

## Fix (runtime, both STEP writers)

Guard each writer with the canonical liveness check (`CCId::ObjExists`, the same one
`sf.kernel.entityExists` uses) before touching the entity, and null-check the `CADEntity`:

- `AssemblyContext::AddEntityReference`: `if(!entityId->ObjExists()) return false;` then
  `if(entity == NULL || !entity->HasKernelEntity()) return false;`
- `ExportToStream` flat loop: `if(!id->ObjExists()) continue;` before the transaction lookup.

A removed entity is skipped; the export returns and writes the remaining valid geometry. No SMLib
kernel change, no attempt to validate a dangling pointer by inspection (there is no cheap test for
that — the fix instead never dereferences an entity the live DB no longer has).

## Verification (rebuilt runtime, fix live)

- `01-repro.mjs`: `common.save(STP)` returns maxLevel 51 instead of hanging; worker 0% CPU.
- **Original journal scripts** (`2026-04-15_21-00-00_common-clear/scripts/`): `04-keepIds-part.mjs`
  and `11-keepIds-full-hierarchy.mjs` (both use `snapshot()`'s internal STP export) now **complete**
  — 2 snapshots each, 0% CPU (previously 100% CPU hang). Captured in `files/original-journal-rerun.log`.
- `05-formats.mjs`: STP (assembly + asPart), OFB and STL all return after `clear` (0% CPU). OFB/STL
  use different serializers that this fix does not touch — they were not hanging for this trigger; the
  fix targets the STEP/SMLibExpressService writers.
- **Happy-path unchanged**: `04-happy-dump.mjs` produces identical valid STP (12786 bytes) on the
  fixed binary and on pristine main — same pre-existing cosmetic `maxLevel 51 [CCVM::ldm: objId not
  found]` from `CommonAPI_v1.save` (verified by stashing the fix and rebuilding main). The guard does
  not skip valid entities.
- **Regression test**: `CommonAPITest_v1.testExportAfterPartialClearDoesNotHang` (CommonTestSuite) —
  exports a partially-cleared model to STEP (both writers) and asserts the call returns. Hang bug, so
  the pre-fix direction is not asserted (it would hang the framework). Passes on the fixed binary.
- **Suites** (on the fix branch): BMTestSuite 390/390, CommonTestSuite 46/46 (incl. the new test),
  Filer/LGS3D/General/CocoR/SystemClasses all green. Pre-existing only: CADTestSuite 6
  `ClassCadKeyApp` (crypto/licensing), BaseSystemTestSuite 1 `Box.ofb` (missing fixture). XMLs in
  `files/`.

## Scope

This closes the STEP-export side of the dangling-entity family for *any* corrupt-state source
(both #64's `clear({keepIds})` and #48's failed-boolean state would now be skipped by the exporter,
even though #48 is already fixed at its own source). The pre-existing `[CCVM::ldm: objId not found]`
cosmetic error on `CommonAPI_v1.save` STP is unrelated and left as-is (not a hang). OFB/STL writers
are separate serializers and out of scope (they did not hang for this trigger).

## Worker hygiene

All bug-fix / sampling workers were `kill -9`'d after each run; none left running.
