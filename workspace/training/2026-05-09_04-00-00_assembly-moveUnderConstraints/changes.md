# Changes: assembly.moveUnderConstraints

Updated `references/assembly/movingUnderConstraints.md` with findings from deep-dive session.

```diff
--- a/references/assembly/movingUnderConstraints.md
+++ b/references/assembly/movingUnderConstraints.md
-The `rotation` param uses three orthogonal direction vectors, not angles:
+The `rotation` param uses three **orthogonal** direction vectors, not angles:

-When both `rotation` and `offset` are provided, rotation is applied first, then translation.
+**Non-orthogonal basis vectors are silently ignored** — no error, no warning, no rotation applied. Always ensure xDir, yDir, zDir are mutually perpendicular.
+
+### Composition order: rotation first, then translation
+
+When both `rotation` and `offset` are provided, rotation is applied first around the pivot point, then translation is applied in world-space. Confirmed numerically: for an instance at COG (80,10,5), a 90° Z rotation + offset(0,20,0) yields COG (10,-60,5) = rotate(80,10)→(10,-80) then +(0,20)→(10,-60).
+
+### Identity move as undo
+
+Calling `moveUnderConstraints` with `offset: [0,0,0]` (or no params at all) returns the instance to its position at session start. This effectively undoes all prior moves within the current session without needing `finishMovingUnderConstraints`.

-The three-step workflow is **not strictly enforced**:
-- `moveUnderConstraints` without prior `startMoving`: succeeds silently (no-op)
+The three-step workflow is **not strictly enforced**, but skipping steps is dangerous:
+- `moveUnderConstraints` without prior `startMoving`: **can hang the worker** (100% CPU, requires kill -9). Do NOT rely on this being a safe no-op.
 - `finishMovingUnderConstraints` without prior `startMoving`: succeeds silently
 - Double `startMovingUnderConstraints` without finish: second start succeeds
+- `moveUnderConstraints` with invalid assembly ID: **hangs the worker** (100% CPU)

-Always use the full start → move → finish sequence for reliable behavior.
+**Always use the full start → move → finish sequence.** Out-of-order calls risk worker hangs.

+- **Non-orthogonal basis vectors are silently ignored.** No error, no warning, no rotation. Always verify your basis vectors are mutually perpendicular.
-- **Constrained axis motion is silently ignored.** No error or warning — the solver just projects onto available DOF.
+- **Constrained axis motion is silently ignored.** No error or warning — the solver just projects onto available DOF. For revolute joints, the `offset` param has zero effect even when combined with rotation.
+- **Worker hang risk.** Calling `moveUnderConstraints` without a prior `startMoving`, or with an invalid assembly ID, can hang the worker at 100% CPU. Always follow the full start → move → finish sequence.
+- **No bounds on offset values.** Negative and very large (1e6+) offsets work fine — no overflow or bounds checking.
```
