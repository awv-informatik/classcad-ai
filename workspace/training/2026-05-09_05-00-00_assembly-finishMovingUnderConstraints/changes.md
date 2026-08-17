# Changes: assembly.finishMovingUnderConstraints

Updated `references/assembly/movingUnderConstraints.md` with findings from finishMovingUnderConstraints deep-dive.

```diff
-Commits the current position. The moved position **persists** — it does not revert.
+Commits the current position. The moved position **persists** — it does not revert, and survives OFB save/load cycles (the position is written into the instance transform). Calling finish twice is safe (idempotent). Calling start → finish without any move in between is also safe (commits the "no motion" state).

-- `moveUnderConstraints` without prior `startMoving`: **can hang the worker** (100% CPU, requires kill -9). Do NOT rely on this being a safe no-op.
-- `finishMovingUnderConstraints` without prior `startMoving`: succeeds silently
+- `moveUnderConstraints` without prior `startMoving`: **hangs the worker** (100% CPU, requires kill -9)
+- `finishMovingUnderConstraints` without prior `startMoving`: **hangs the worker** (100% CPU, requires kill -9)
 - Double `startMovingUnderConstraints` without finish: second start succeeds
+- Double `finishMovingUnderConstraints`: safe, idempotent (second call is a no-op)
```
