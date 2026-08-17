# Changes — operationMoveBefore training

## New file: `references/part/operationMoveBefore.md`

```diff
+# part.operationMoveBefore / part.operationMoveToEnd
+
+Controls the rollback bar position in the design tree. `operationMoveBefore` moves the bar to just before a specified feature, hiding/deactivating all features at and after that position. `operationMoveToEnd` moves the bar to the end, restoring all features.
+
+## Prerequisites
+
+- A part (`part.create`)
+- At least one feature in the design tree
+
+## Key Parameters
+
+### operationMoveBefore
+
+- `id` — the **part** ID (not a feature ID)
+- `featureId` — the feature/workgeometry/sketch ID to move the bar before. Accepted types: `feature`, `workgeometry`, `sketch`. Passing a part ID gives error 1001.
+
+### operationMoveToEnd
+
+- `id` — the **part** ID
+
+## Return Value
+
+Both return VOID (null). Check `maxLevel` — 31 = success.
+
+## How It Works
+
+The CC_RollbackBar is a node in the OperationSequence that physically moves position within the children array. Features after the bar are not evaluated but remain in the structure tree. All nodes survive — nothing is deleted.
+
+## Primary Use Case: Insert Features Mid-Tree
+
+## Behavior Rules
+
+- Idempotent. Calling moveBefore on the same position twice is a silent no-op.
+- moveToEnd when already at end is also a silent no-op.
+- Backward moves hide features immediately — no recalc.
+- Forward moves trigger recalculation of the features being restored.
+- Feature creation at mid-tree inserts the new feature at the bar's current position.
+- Default work geometry can be targeted — bar can go before built-in planes.
+
+## Interaction with Other APIs
+
+- getFeature — NOT affected by bar position.
+- openFeature — works on both rolled-back and visible features.
+- Booleans — rolling back past a boolean undoes it.
+
+## Gotchas
+
+- featureId must be feature/workgeometry/sketch, NOT part ID.
+- Structure tree always shows ALL features regardless of bar position.
+- Downstream features are re-evaluated on moveToEnd.
```
