# Changes — RollbackBar vs GhostRollbackBar

## New file: `references/part/rollback-bars.md`

Conceptual LLM doc covering the two-bar model:
- RollbackBar (CC_RollbackBar node, controlled by operationMoveBefore/moveToEnd)
- GhostRollbackBar (virtual, tracked by editFeatureIndex, controlled by openFeature/closeFeature)
- Key behavioral differences (creation vs editing permissions)
- Independence of the two mechanisms
- isDirty semantics
- Mid-tree editing use case

## Updated: `references/part/openFeature.md`

```diff
+## How It Works (GhostRollbackBar)
+
+`openFeature` moves an internal "GhostRollbackBar" to the position before the target feature. This is NOT a physical node in the structure tree — it's tracked by the `editFeatureIndex` member on the OperationSequence node. `closeFeature` moves the GhostRollbackBar back and recalculates downstream features.
+
+The GhostRollbackBar operates independently of the RollbackBar (`operationMoveBefore`). See `rollback-bars.md` for the full two-bar model.
+
+- `rollback-bars.md` — RollbackBar vs GhostRollbackBar conceptual overview
```

## Updated: `references/part/operationMoveBefore.md`

```diff
-- `part.openFeature` / `part.closeFeature` — the editing gate (different from the rollback bar)
++ `part.openFeature` / `part.closeFeature` — the editing gate (uses GhostRollbackBar, a different mechanism)
++ `rollback-bars.md` — RollbackBar vs GhostRollbackBar conceptual overview
```
