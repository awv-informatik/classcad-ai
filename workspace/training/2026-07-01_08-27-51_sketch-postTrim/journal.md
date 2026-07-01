# Training: sketch.postTrim (retrain — Category 4.10 #4)

**Date:** 2026-07-01
**Task:** PLAN.md Step 4, Category 4.10, Task #4 — `Api study of sketch.postTrim`
**Source material:** upstream `references/api/sketch.md`, `references/sketch/preTrim.md` + `references/sketch/trim.md` (shared workflow — cited), `source/sketch-split-trim-guide.md`
**Test matrix:** `test-matrix.json` — read-only design workflow (no live agent calls; all execution serial under me). 10 postTrim-specific scripts.

## Environment

- Worker was down (my earlier bg worker got killed); restarted on 9094. `@classcad/api-js` 21.2.0. Helper reused.
- postTrim is the finalizer (step 3), heavily exercised in preTrim + trim sessions. This session targets postTrim-specific gaps; shared facts cited to preTrim.md/trim.md.

## Goal

Characterize postTrim: staging cleanup (both containers removed on a normal cycle), the "normal editable state" doc
claim, dimension survival across postTrim, restore fidelity, idempotence, error map, the NoneSplitted0 leak, the
StopEditing auto-finalize claim, and coalescing.

---

## 00 — smoke: finalize + cleanup

Script: `scripts/00-smoke.mjs` — preTrim staging `[NoneSplitted, SplittedCurves]` → after postTrim `[]`; postTrim VOID/mL31; constraints recreated `[Auto_H0, Auto_V0, Auto_Coinc]`; clean L survivors with new ids.

## 01 — normal cycle staging cleanup

Script: `scripts/01-normal-cycle-staging-cleanup.mjs` — ✅ PASS. baseline containers `[]` → staged `[NoneSplitted, SplittedCurves]` → after postTrim `[]`. Both containers **removed by name**, **census delta 0**, no `*0` leak. postTrim VOID/mL31, clean L.

## 02 — editable state + fresh cycle

Script: `scripts/02-editable-state-fresh-cycle.mjs` — ✅ PASS. After postTrim: **0 dead ids** (every getGeometry id resolves); **add-line works** (2→3, endpoints match); a **2nd full preTrim→trim→postTrim cycle** re-stages then re-cleans, containers `[]` again — **no accumulation**. Confirms the doc's "returns to a normal editable state" claim.

## 03 — solver live after postTrim (+ planeless control)

Script: `scripts/03-solver-live-planed.mjs` — ✅ PASS. Planed sketch, `HD_main` HORIZONTAL_DISTANCE on the H line, trim V's overhang (H+dim survive), postTrim, then `updateDimension(HD_main, 70)` → **result 1 (solved), H length 100→70 (geometry moved)**. Planeless control → **result 0, unmoved**. Solver is fully live after postTrim; the check discriminates.

## 04 — dimension DROPPED when its anchor is trimmed away (finding)

Script: `scripts/04-HD-dimension-survival.mjs` — `HD_main` on H's endpoints (0,50)/(100,50), value 100. I trimmed the H segment containing the **(100,50) end anchor**. After postTrim: **`HD_main` is GONE — dimensionCount 1→0**. The H survivor is (0,50)→(50,50), length 50.
**Finding:** a dimension survives postTrim **only if both its anchor points survive**. Trim away a segment that carries a dimension's anchor point and **the dimension is dropped** (not re-anchored). Contrast 03/05 where the anchors survive and the dimension persists.
**📌 LLM doc + TODO:** trimming a dimensioned endpoint silently drops the dimension.

## 05 — restore fidelity + handle-churn asymmetry

Script: `scripts/05-restore-fidelity-notrim.mjs` — ✅ PASS.
- **No-trim postTrim** and **`trim([])`→postTrim** both restore geometry with **original ids, byte-exact coords**, and clean the staging containers.
- **BUT the dimension handle id churns even on a no-trim postTrim** (`HD_A` 72→104). So **geometry ids are stable, constraint/dimension handles are recreated with new ids** even when nothing was trimmed. **Re-fetch handles by name after any postTrim.**

## 06 — idempotence

Script: `scripts/06-idempotence-twice-and-bare.mjs` — ✅ PASS.
- **postTrim twice in a row:** the 2nd is a **pure no-op** — geometry byte-identical, constraints unchanged (`Auto_Coinc:104, Auto_H0:101, Auto_V0:102` identical across both calls — **no double-suffix `Auto_H00`, no id churn**).
- **Bare postTrim** (no preTrim) → mL31 no-op, creates **no** containers (0→0). (Contrast preTrim, which creates containers even on an empty sketch.)

## 07 — error map

Script: `scripts/07-error-map.mjs` — ✅ PASS. `{id}`-only surface:
- missing `id` → **1004** "must be provided", VOID.
- non-existent id → **1006**, VOID.
- part / point / line id → **1001 `["sketch"]`**, VOID.
- **Mid-workflow error is safe:** a bad postTrim (point id) on a staged sketch leaves `SplittedCurves` childCount **unchanged (3→3)**; the corrective postTrim then finalizes cleanly (2 lines). Errors → VOID, staging untouched, resumable.

## 08 — NoneSplitted0 leak (characterized)

Script: `scripts/08-noneSplitted0-leak.mjs` —
- **Reproduced:** `preTrim` ×2 → `postTrim` leaves a stale empty **`NoneSplitted0` (childCount 0)**; `SplittedCurves`/`NoneSplitted` are gone; geometry + original ids fine.
- **A 2nd postTrim does NOT sweep it** — the orphan persists.
- **A fresh full cycle on the leaked sketch still works** (mL31) — the leak is cosmetic.
- **The `trim`-then-re-`preTrim` path also leaks** a `NoneSplitted0` (so it's **not exclusive to preTrim-twice**); empty orphans **persist/accumulate** across leak-inducing paths.
**📌 TODO:** refines #159 — leak comes from any re-preTrim-without-postTrim (not only double-preTrim), 2nd postTrim doesn't clean it.

## 09 — StopEditing / closeFeature auto-finalize

Script: `scripts/09-closefeature-autofinalize.mjs` — the guide claims postTrim is auto-called on StopEditing. **There is no `StopEditing`/`setCurrentFeature`/`finishEdit` endpoint in the v1 API** (grep of `references/api/sketch.md` → 0 hits) — so the literal claim is **UNVERIFIABLE via v1**. However, **`part.closeFeature` on a staged sketch auto-finalizes**: staging `[NoneSplitted, SplittedCurves]` → `[]`, mL31. So the auto-finalize-on-stop-editing behavior **is reachable via `part.closeFeature`** (the API-level "stop editing"), even though no `StopEditing` method is exposed.
*(Not separately measured: whether closeFeature commits the trim vs restores — staging cleanup matches postTrim; assume commit.)*

## 10 — coalesce (line + arc)

Script: `scripts/10-coalesce-line-and-arc.mjs` — a long H split into 3 contiguous segments (all kept, no trim) → postTrim → **1 line** spanning 0..100. A top semicircle split into 3 arc segments (all kept) → postTrim → **1 arc**. So contiguous kept segments coalesce to a single curve for **both lines and arcs**.
*Nuance:* the coalesced line kept its **original id** (58) because nothing was trimmed on it (keep-all = restore, per 05). The "coalesced curves get a NEW id" rule (preTrim.md L83) applies only when the curve was **trimmed** (proven in the preTrim/trim sessions). My script's `newId` assertion was mis-specified — the coalesce itself is confirmed.

---

## Coverage checklist (Step 4A)

- [x] postTrim VOID/mL31 (00/01); staging cleanup both containers (01)
- [x] Editable state: dead ids, add-line, fresh cycle (02)
- [x] Solver live + planeless control (03); dimension drop-on-anchor-trim (04)
- [x] Restore fidelity + handle churn asymmetry (05)
- [x] Idempotence (twice + bare) (06); error map + mid-workflow safety (07)
- [x] NoneSplitted0 leak characterization (08)
- [x] StopEditing UNVERIFIABLE + closeFeature auto-finalize (09); coalesce line+arc (10)
- [x] Spatial/numeric claims backed by measurements

## Synthesis — postTrim behavior (verified)

1. **Finalizes + cleans:** a normal cycle removes BOTH `SplittedCurves` and `NoneSplitted` (census delta 0, no leak); returns the sketch to a **genuinely editable, solver-live state** (add lines, run fresh cycles, updateDimension re-solves and moves geometry).
2. **Restore fidelity:** no-trim / `trim([])` postTrim restores **original geometry ids + byte-exact coords**; only trimmed curves get new ids. **BUT constraint/dimension handles are always recreated with new ids** — re-fetch by name.
3. **Dimensions:** survive postTrim **iff their anchor points survive**; a trim that removes an anchor **drops the dimension** (dimCount decreases).
4. **Idempotent:** a 2nd postTrim is a pure no-op (no double-suffix, no churn); bare postTrim (no staging) is a no-op that creates no containers.
5. **Errors** (`{id}` only): 1004 missing / 1006 bad id / 1001 `["sketch"]`; all VOID; a mid-workflow error leaves staging untouched and resumable.
6. **Leak:** any re-`preTrim` without an intervening `postTrim` (double-preTrim OR trim-then-re-preTrim) leaves a stale empty `NoneSplitted0`; a 2nd postTrim doesn't sweep it; cosmetic (fresh cycles still work).
7. **No v1 `StopEditing`** endpoint (claim UNVERIFIABLE), but `part.closeFeature` on a staged sketch **auto-finalizes**.
8. **Coalesce:** contiguous kept segments merge into one curve for lines and arcs.
