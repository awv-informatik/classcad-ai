# TODO #48: `solid.offset` — "complex boolean topology hangs server" — MISDIAGNOSED; real bug found + fixed

**TODO entry:** #48 — "Offsetting a box with 3 cylinder holes … the complex topology causes the offset algorithm to enter an infinite loop."
**Original session:** `2026-04-15_09-00-00_solid-offset` entry 13 (`scripts/13-multiple-booleans.mjs`).

## Outcome

`solid.offset` does **not** hang on multi-hole topology — the original diagnosis is wrong. The hang
in the original script comes from a **STEP export (`common.save`) over a corrupt part state** left by
a multi-tool `solid.subtraction` that failed part-way through. The offset is not involved.

Two deliverables:
1. **Skill doc corrected** — `references/solid/offset.md` no longer claims offset hangs on complex
   topology (committed + pushed to `master`, see below).
2. **Real bug fixed in product code** — the export-hang root cause (dangling "ghost" tool shells left
   by a partially-failed multi-tool boolean) is fixed at the cclass boolean procs. See
   **§ Resolution — Option 2 landed** at the bottom. This is the diagnosis-led fix the user
   green-lit ("let's go with option 2"); it supersedes the "fix not landed" note in the older
   sections below, which were written during diagnosis.

The diagnosis below (bisection, stack sampling, dangling-entity probing) is kept as the
investigation record that led to the fix.

## Bisection (all on current main, rebuilt binary)

The original script does three things the journal conflated: a one-call 3-cylinder subtraction,
a `snapshot('before')`, then the offset. Isolating each (`scripts/02-isolate.mjs`,
`03-trigger.mjs`, `04-tree-trigger.mjs`):

| Sequence before offset | offset result | CPU |
|---|---|---|
| nothing (plain box) | maxLevel 31 | 0% |
| + extra reference box | maxLevel 31 | 0% |
| + `setDatabaseSettings(graphics on)` | maxLevel 31 | 0% |
| + `common.recalc` | maxLevel 31 | 0% |
| + `setDatabaseSettings` + `recalc` | maxLevel 31 | 0% |
| + `GetTree`(refresh) + `recalc` | maxLevel 31 | 0% |
| + harness `snapshot('before')` | **HANG 99% CPU (3/3)** | — |

So offset is fine in every case; only the full `snapshot()` path hangs. The server log during a
hang showed the real sequence: the **3-cylinder subtraction had failed** ("nonmanifold … Operation
canceled", maxLevel 51), then `snapshot()` called `common.save` (STEP) which errored
`[CCVM::ldm: objId not found]` and spun at 100% CPU.

### The subtraction is the flaky part, not offset

`scripts/05-sub-determinism.mjs` — the one-call 3-tool subtraction
(`tools:[c1,c2,c3]`) returns `nonmanifold` (maxLevel 51) **6/6 times**, leaving the box uncut.
`scripts/06-realholes.mjs` — doing the holes as separate calls: the **first** subtraction succeeds
(box volume 72000 → 69644), but the **2nd and 3rd fail nonmanifold** even though the holes are
disjoint and interior. So the original script's box was never the clean 3-hole solid the journal
assumed; it was a partially-cut/failed state.

### The real hang, isolated

`scripts/07-save-hang.mjs` — one-call 3-cyl subtraction (fails nonmanifold), then
`common.save({format:'STP'})` with **no offset at all** → **hang, 98% CPU**. This is the actual
defect the original script tripped over: STEP export over the corrupt state left by the failed
boolean. It matches TODO #64 (`common.clear` + STEP/OFB export hangs on a degenerate state).

### Offset on a genuine holed solid works

`06-realholes.mjs`: after the box had one real hole, `solid.offset(distance:2)` returned
maxLevel 31 and the volume grew (69644 → 94269), 0% CPU. Offset handles boolean-cut solids fine.

## Mandatory original-script rerun

`2026-04-15_.../scripts/13-multiple-booleans.mjs` still hangs on current main — but the bisection
above proves the cause is the `snapshot('before')` STEP export over the failed-subtraction state,
not `solid.offset`. Captured in `files/original-journal-rerun.log`.

## Deliverables

- **Skill doc corrected** (`classcad-skill`): `references/solid/offset.md` — removed the
  "fragile / hangs the server on complex topology / 3+ holes = SERVER HANG" claims (false), replaced
  with the verified behavior (offset returns, does not hang) and a note explaining the original hang
  was a STEP export over a corrupt post-failed-boolean state. Added the practical guidance to check
  each boolean's `maxLevel` before continuing.
- **No product-code change.** Offset isn't broken. The two genuine issues found are out of scope for
  this entry and deeper than a wrapper guard:
  1. multi-tool / sequential subtraction returning `nonmanifold` on disjoint interior holes
     (returns a clean error, not a hang — worth its own investigation);
  2. STEP export hanging on a corrupt state (a 💀 hang — same class as TODO #64).
  Both are recorded here; (2) is cross-referenced from #64.

## STEP-export hang — root cause + fix attempt (the real 💀)

Minimal trigger (`07-save-hang.mjs`): a one-call multi-tool `solid.subtraction`
(`tools:[c1,c2,c3]`) where a later tool yields a non-manifold condition → then
`common.save({format:'STP'})` spins at 98% CPU. Single-tool subtractions, plain boxes,
and recalc/GetTree all export fine — so the trigger is specifically the brep left behind
by a **boolean that failed mid-operation**.

Root cause (read `BooleanOperations::DoBoolean`, `BooleanOperations.cpp:112`): the code
builds `IwMerge merge(ctx, blankSolid, toolSolidCopy, …)` (line 155) **before** the
manifold precondition is enforced (the `!IsManifoldSolid()` throw at line 178/230). The
merge works on the blank brep in place; when the post-setup check throws, the blank is
left in a corrupt/non-manifold state. A later STEP export traverses that brep and loops.
(`IwMerge` copies the *tool* when `keepTool` — line 128-131 — which strongly implies it
consumes/mutates its operands; the blank gets no such protection.)

**Fix attempt (reverted):** added a manifold precondition check *before* `IwMerge`.
It did **not** fix the hang — the blank reads manifold *before* the merge, and the merge
itself is what corrupts it, so an earlier input-check never fires for this case. Reverted;
runtime is clean on main. No half-fix shipped.

**What a real fix requires (all need maintainer/SMLib-owner sign-off — not landed):**
1. *Defensive copy of the blank brep in `DoBoolean`* so a failed boolean is a true no-op.
   Correct behavior, but adds a brep copy to every boolean (hot-path perf) and changes
   brep ownership/lifetime in core kernel code across many throw sites (memory-safety risk).
2. *Harden the STEP exporter* (`SMLibExpressService`/Express) to detect/skip/repair an
   invalid brep instead of looping. Fixes the symptom regardless of cause and would also
   close TODO #64 — if that export code is source-available and safely modifiable.
3. *Make multi-tool booleans atomic at the cclass level* (validate/skip disjoint tools
   before consuming any). Cheaper but heuristic; doesn't help single-call failures or #64.

This is the same failure family as **TODO #64** (`common.clear` + STEP/OFB export hangs on
a degenerate state). Recommend treating the export-hardening (option 2) as the consolidated
fix for both, pending a check that the exporter loop is in modifiable source.

Status: root cause identified; fix **not** landed (needs a scoped decision on the above).

### Update — exact loop located (stack sample) + precise mechanism

`sample` on the hung worker (PID spinning at 99%) shows the loop bottoming out in:
`SMLibExpressService::ServiceCallFunc` → `ExportToFile` → `__dynamic_cast` → `_sigtramp`
(1483 of 1700 samples in `_sigtramp`). I.e. a `dynamic_cast` is **repeatedly faulting on a
dangling pointer**, a signal handler catches the fault, and execution retries the same
instruction — a fault-loop, not a classic `while` loop. The loop is in **ClassCAD's own
source** (`runtime/Source/SMLibExpressService/c/SMLibExpressService.cpp`, the `ExportToFile`
entity loop ~line 785), not a vendored binary — so it is *technically* modifiable.

Which pointer is dangling (`10-which-dangling.mjs`, probing each entity with massprops after
the failed 3-tool subtraction):
- `box` → maxLevel 31, volume 69644 — **valid** (it kept the one hole c1 made).
- `c1`, `c2` → maxLevel 51, no volume — **consumed/invalid** (removed mid-operation).
- `c3` → maxLevel 31, volume 3927 — valid (never processed).

So the box is fine; the dangling entities are the **tools consumed during the partially-failed
multi-tool subtraction**. The cclass `subtraction` proc does `FORALL tools: CADH_SubSolid …`
then `deleteSolid(tools)` only after the loop; the throw on c2 aborts the loop before that
cleanup, and `BooleanOperationCADH` itself `RemoveObject`s both the succeeded tool (c1) and the
failed tool (c2). The STEP-export transaction (`CCTransactionT … TransDbObject(id)`) still
returns stale CADEntity shells for c1/c2 whose `GetType()==eBrep` but whose
`GetKernelEntity()` is a freed pointer → `dynamic_cast<IwBrep*>(dangling)` fault-loops.

Why the solid APIs don't hit this but export does: `solid.*` resolve ids through
`TOID`/`idTypes` validation (the entry-5 guard) which rejects consumed ids cleanly (massprops
on c1 → 51). **STEP export skips that validation** and dereferences the kernel directly.

### Why option 2 (harden the exporter) is not a *simple* guard

The faulting cast is `dynamic_cast<IwBrep*>(ent->GetKernelEntity())`. A freed-but-non-null
kernel pointer cannot be safely detected by inspection — there is no cheap "is this pointer
alive" test, and the stale transaction shell still reports `GetType()==eBrep` with a non-null
(dangling) kernel. So a robust fix is **not** a one-line export guard. It belongs at one of:
- the **DB/transaction layer** — the export transaction must not surface removed objects with
  dangling kernels (deepest, safest-conceptually, but transaction-internals work); or
- the **cclass boolean procs** — make a multi-tool boolean clean up consumed-tool shells on
  partial failure so the DB stays consistent (medium risk; per-proc); or
- the **core boolean** — defensive-copy the blank so a failed op is a true no-op (perf/ownership).

All three are deeper than a safe unilateral training change and warrant maintainer/SMLib-owner
review. This same dangling-entity-in-export mechanism very likely underlies **TODO #64**
(`common.clear` + STEP/OFB export hang on a partially-cleared state) — a single transaction/export
robustness fix would plausibly close both.

**Recommendation:** hand to the maintainers with this diagnosis; or, if a local attempt is
wanted, the cclass partial-failure cleanup in the boolean procs is the least-deep option.

## Worker hygiene

Hung workers from the snapshot/save repros were `kill -9`'d and restarted each time; none left
running.

---

## Resolution — Option 2 landed (cclass boolean procs clean up on partial failure)

**Decision.** Of the three candidate fix sites (core boolean defensive-copy / export hardening /
cclass partial-failure cleanup), the cclass cleanup was chosen: it removes the dangling shells *at
the source* the moment a boolean partially fails, so the DB never reaches the inconsistent state the
exporter chokes on. It needs no SMLib-kernel change, no per-boolean brep-copy on the hot path, and no
fragile "is this pointer alive" probe in the exporter. It also closes the same failure family the
diagnosis flagged (a degenerate state surfacing dangling kernels to STEP/OFB export).

**Repo / branch.** `classcad-cclasses`, branch `fix/boolean-partial-failure-cleanup`.
**File.** `Source/BaseModeling/api/SolidAPI_v1.cclass` — all four multi-tool boolean procs:
`subtraction`, `intersection`, `union`, `merge`.

### The mechanism that was wrong

Each proc did `FORALL tools: CADH_<op>Solid(target, tool)` then `deleteSolid(tools)` **after** the
loop. When a later tool is non-manifold against the running result, `CADH_SubSolid` (etc.) throws a
C++ exception at `BooleanOperations.cpp:230`. The throw aborts the `FORALL` **before** the cleanup
`deleteSolid` runs, and the C++ `BooleanOperationCADH` has already removed the consumed tool kernels.
What's left: CADEntity shells for the consumed/failed tools whose `GetKernelEntity()` is a freed
pointer. STEP/OFB export later does `dynamic_cast<IwBrep*>(freedPtr)` on each → fault-loop, 100% CPU.

### The fix (same shape in all four procs)

1. **Nested PROC around the kernel call** (`SubOneTool` / `IntersectOneTool` / `AddOneTool` /
   `MergeOneTool`). `LOG_OpenTryCatchScope` only catches a C++ throw at a **PROC-call boundary**, not
   at an inline `CADH_*` call — so the per-tool boolean must be its own proc for the catch to fire.
   The proc returns the new target id (sub/intersect) or `TRUE` (the void-call ops union/merge).
   The try-catch scope is opened **immediately before** each per-tool call and closed
   **immediately after** (one scope per call, inside the FORALL), matching every other
   `LOG_OpenTryCatchScope` usage in the codebase — they all wrap exactly one proc call. (An earlier
   draft opened one scope around the whole FORALL; switched to per-call to match the idiom. Both
   behave identically here, but per-call is the convention and the safer pattern.)
2. **`failed` / `targetRemoved` flags + try-catch scope around the FORALL.** On a caught throw the
   nested proc returns `VOID`; `ISVOID(result)` sets `failed = TRUE` and the loop stops advancing
   (`IF !failed AND !targetRemoved`). `result = NULLID` (target fully consumed) sets `targetRemoved`.
3. **Cleanup ALWAYS runs**, building `toolsToErase` that **excludes the target** before
   `deleteSolid`. Excluding the target is what keeps the self-reference guard correct: a
   `subtraction(target, tools:[target])` is rejected before anything is consumed, so the target must
   not be deleted by cleanup. `deleteSolid`/`CADH_EraseEntity` tolerate already-consumed ids.
4. **Then** surface a clean error (`OBJ_ErrorMessage(..., ERR:NOTWELLDEFINED)`) — distinct messages
   per op and per case (target-removed vs tool-failed) — and `RETURN`.

`union`/`merge` use `CADH_AddSolid`/`CADH_MergeSolid`, which mutate in place and return nothing, so
their nested proc does the call then `RETURN TRUE`; there is no `NULLID`/`targetRemoved` path for them.

### Verification (all on the rebuilt cclasses, fix live)

- **Original crash script** `2026-04-15_.../scripts/13-multiple-booleans.mjs` (the one the TODO blamed
  on offset): now **runs to completion** — subtraction fails-but-cleans-up, box survives, `offset`
  returns maxLevel 31, **both before/after snapshots render (STEP export no longer hangs)**, worker
  **0% CPU**. (Previously: wedged at 99% CPU, `kill -9` only.)
- **Minimal repro** `scripts/repro-step-export-hang.mjs`: `common.save({format:'STP'})` after the
  partial-failure subtraction now returns instead of hanging.
- **Entity-state probe** `scripts/probe-state.mjs` (post-fix): box → maxLevel 31, vol 69644 (survived
  with c1's hole); c1/c2/c3 → maxLevel 51, no volume (all cleaned up). On unfixed main c3 was still a
  live solid (vol 3927) — the fix now erases it too, so no shell is left dangling.
- **Regression test added** — `Source/Tests/UnitTesting/BaseModeling/api/SolidAPITest_v1.cclass`,
  `testBooleanPartialFailureCleanup`: asserts the partial-failure subtraction reports an error, the
  target survives (`CADH_ObjectExists(box) > 0`), and no tool shell is left dangling
  (`CADH_ObjectExists(c1|c2|c3) = 0`). Fails cleanly (no hang) if the cleanup regresses.
- **Test suites** (rebuilt): **BMTestSuite 391/391** (390 prior + the new regression test), 0
  failures/errors — `testBooleanSelfReference` + `testSubtraction` + `testMerge` all still green.
  Other suites unchanged from baseline: CADTestSuite 6 fails (all `ClassCadKeyApp`
  crypto/licensing — pre-existing), BaseSystemTestSuite 1 error (`Box.ofb` missing fixture —
  pre-existing); Common/Filer/LGS3DService/General/CocoRCompiler/SystemClasses all clean.

### Scope note

This fixes the *production* path (a partial-failure boolean leaving a corrupt DB that hangs export).
It does **not** alter `solid.offset`, which was never broken. The deeper kernel question — *why* a
disjoint/non-overlapping tool yields a non-manifold throw instead of a clean "tools don't overlap"
rejection — is left as-is; the user-visible result is now a clean error message plus a consistent
model, which is the correct contract. `common.clear` + export (TODO #64) is a sibling symptom of the
same "dangling kernel reaches the exporter" family; if it recurs from a *different* corrupt-state
source, the durable fix would be exporter/transaction hardening, but that is out of scope here.

### Adjacent pre-existing bug found while verifying (NOT introduced by this fix, NOT fixed here)

While checking the published boolean docs I found a separate, **pre-existing** defect:
repeating solid booleans on a **degenerate/tangent** tool (a cylinder whose wall exactly touches a
box face, e.g. box `60x40x30` + cylinder Ø10 at `[15,15,-5]`) is non-deterministic — the first call
in a session may succeed, after which **subsequent boolean calls fail with a spurious
`"Set the parameter \"id\" = VOID is not allowed in this situation!"` (code 1001)** even on freshly
created, valid solids. Repro: `scripts/probe-keeptools.mjs` (and `probe-tangent.mjs`).

Verified pre-existing: with `SolidAPI_v1.cclass` reverted to pristine `main` (no fix), the **identical**
1001 sequence reproduces. So this is unrelated to the ghost-shell change — it is a deeper
session/exception-state defect (a non-manifold C++ throw from the kernel appears to corrupt
parameter handling for later calls). It is independent of `keepTools` (so not the cleanup path) and
independent of per-loop vs per-call scoping. Out of scope for this entry; logged as its own TODO so
it can be investigated separately. Note this does **not** affect the export-hang fix: the fix is
verified on the *first* boolean of a session (the actual reported scenario), where it behaves
correctly.
