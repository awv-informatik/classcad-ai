# Training: assembly.finishMovingUnderConstraints

**Date:** 2026-05-09

## Goal

Deep-dive on `v1.assembly.finishMovingUnderConstraints` — the final step that commits moved positions. Prior sessions tested it extensively as part of the workflow but didn't isolate its specific behaviors.

**Methods to cover:**

- `finishMovingUnderConstraints` — params: id (assembly root)

**Questions:**

- Does double-finish (calling finish twice) cause any issues?
- What position does finish commit if no move was called between start and finish?
- Does finish without any prior start cause issues (re-verify with isolated test)?
- What happens if we start, move, finish, then immediately move again without a new start?
- Does the position survive a save/load cycle after finish?

---

## 01 — double finish

Script: `scripts/01-double-finish.mjs` — ✅ Double finish is safe, position unchanged.

**Data:** COG after move: (70, 45, 10). After finish1: (70, 45, 10). After finish2: (70, 45, 10). Both finishes return VOID with maxLevel=31. positionStable=true.

**Learned:** Calling `finishMovingUnderConstraints` twice in a row is safe — it's idempotent. The second call is effectively a no-op. No error, no position change.

## 02 — start → finish (no move)

Script: `scripts/02-start-finish-no-move.mjs` — ✅ Position preserved when no move was called.

**Data:** COG before: (50, 35, 20). After start→finish (no moveUnderConstraints in between): (50, 35, 20). positionUnchanged=true. maxLevel=31.

**Learned:** Calling `startMovingUnderConstraints` then immediately `finishMovingUnderConstraints` without any `moveUnderConstraints` in between is safe. The position is unchanged — it commits the "no motion" state.

## 03 — position persists through save/load cycle

Script: `scripts/03-persist-after-save-load.mjs` — ✅ Moved position survives OFB save/load.

| ![before-save](files/03-persist-after-save-load-before-save-solid.png) | ![after-load](files/03-persist-after-save-load-after-load-solid.png) |
|---|---|

**Data:** COG before save: (95.0, 55.0, 35.0). After clear → load from OFB → recalculate: (95.0, 55.0, 35.0). Position identical (within FP epsilon).

**Learned:** Positions committed by `finishMovingUnderConstraints` are persisted into the OFB file and survive a save → clear → load cycle. The moved position is part of the instance's transform, not a transient state.
**📌 LLM doc:** Moved positions persist through OFB save/load — they are written into the instance transform.

## 04 — finish without any prior start (HANG)

Script: `scripts/04-finish-only-no-start.mjs` — ❌ Worker hung at 100% CPU.

**Data:** COG before was logged (20, 15, 10), then the `finishMovingUnderConstraints` call never returned. Worker required kill -9.

**Learned:** `finishMovingUnderConstraints` without any prior `startMovingUnderConstraints` **hangs the worker**. This directly contradicts the prior session's finding (script 05) which reported "succeeds silently." The prior test likely had a different context (multiple API calls before finish that set up some internal state). This is a dangerous operation.
**📌 LLM doc:** CRITICAL UPDATE — finish without start hangs the worker, not a silent success. Correct the Server Leniency section.

