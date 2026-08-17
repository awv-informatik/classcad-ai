# RollbackBar vs GhostRollbackBar

ClassCAD's design tree has **two** rollback mechanisms that control which features are active and editable. They serve different purposes and operate independently.

## The Two Bars

### RollbackBar (persistent design history position)

- **Node:** `CC_RollbackBar` (id=20 in a fresh part) — a physical node in the OperationSequence
- **Controlled by:** `operationMoveBefore` / `operationMoveToEnd`
- **Purpose:** Controls which features are "active" in the design tree. Features after the bar are deactivated (not evaluated). Features before the bar are live.
- **Observable:** Position visible in the OperationSequence `children` array — the bar node physically moves position among its siblings
- **Allows:** Feature creation at the bar position. Does NOT allow feature editing.

### GhostRollbackBar (temporary editing context)

- **Node:** None — it is NOT a physical node in the structure tree
- **Controlled by:** `openFeature` / `closeFeature`
- **Purpose:** Creates an exclusive editing context for one specific feature. Blocks all other feature operations (creation AND editing other features).
- **Observable:** Tracked by the `editFeatureIndex` member on the OperationSequence node. Value = index into `children` array of the feature being edited. `-1` = no feature open.
- **Allows:** `update*` calls on the opened feature only. Nothing else.

## How to Observe Both

The OperationSequence node (id=18) exposes three members:

```
OperationSequence.members:
  editFeatureIndex: -1      ← GhostRollbackBar position (-1 = inactive)
  isDirty: 0                ← whether updates were made during current edit session
  _VERSION: "2/2020_..."    ← internal version
```

**RollbackBar position:** Find id=20 in the `children` array. Everything after it is deactivated.

```
Default (bar at end):     [..., BoxRef, CylRef, SphRef, RollbackBar]
After moveBefore(cyl):    [..., BoxRef, RollbackBar, CylRef, SphRef]
```

**GhostRollbackBar position:** Read `editFeatureIndex`. It points to the children array index of the feature being edited.

```
Nothing open:           editFeatureIndex = -1
openFeature(box):       editFeatureIndex = 7  (children[7] = BoxRef)
openFeature(cyl):       editFeatureIndex = 8  (children[8] = CylRef)
```

## Key Behavioral Differences

| Capability | RollbackBar (operationMoveBefore) | GhostRollbackBar (openFeature) |
|---|---|---|
| Create features | ✅ At bar position | ❌ Blocked |
| Update specific feature | ❌ Needs openFeature first | ✅ Only the opened feature |
| Update other features | ❌ | ❌ |
| Move RollbackBar | ✅ (that's what it does) | ✅ (independent — works during open) |
| Structure tree changes | Children array reordered | No structural change (only editFeatureIndex) |
| Recalculation trigger | `moveToEnd` replays features | `closeFeature` recalculates downstream |

## Independence

The two bars operate independently:

- `operationMoveBefore`/`operationMoveToEnd` work while a feature is open
- `openFeature` works on features behind the RollbackBar (rolled-back features)
- Both can be active simultaneously at different positions

## Mid-Tree Editing (the primary use case for openFeature)

The GhostRollbackBar is what enables safe mid-tree parametric editing:

```js
// Tree: Box → Cylinder → Boolean(subtraction)
// Want to resize the Box without breaking the Boolean

await api.v1.part.openFeature({ id: boxId })    // GhostRollbackBar → before Box
await api.v1.part.updateBox({ id: boxId, height: 120 })  // modify Box
await api.v1.part.closeFeature({ id: boxId })    // GhostRollbackBar → back
// Boolean automatically recalculates with the new Box dimensions
```

Without this mechanism, you would need to:
1. `operationMoveBefore` to before the Box
2. Delete the Box
3. Recreate the Box with new dimensions
4. `operationMoveToEnd` and hope the Boolean re-resolves

That approach risks breaking downstream feature references. `openFeature` avoids this entirely.

## isDirty Semantics

The `isDirty` member tracks whether recalculation is pending:

- Becomes `1` when `update*` is called during an open session
- Resets to `0` when:
  - `closeFeature` is called AND RollbackBar is at the end (full recalc occurs)
  - `operationMoveToEnd` replays features past the modified point
- Stays `1` after `closeFeature` if RollbackBar is mid-tree (full recalc deferred until moveToEnd)

## Gotchas

- **GhostRollbackBar is invisible.** No node in the tree — only `editFeatureIndex` reveals it.
- **RollbackBar position matters for isDirty.** Closing a feature with the bar mid-tree does NOT do a full recalc. You must `moveToEnd` to replay deferred features.
- **openFeature blocks everything except updates to the target.** No creation, no editing other features — even if the RollbackBar has been moved to allow it.
- **Both can be active simultaneously.** This is valid and well-defined — they don't interfere.

## Related

- `part.openFeature` / `part.closeFeature` — the GhostRollbackBar API
- `part.operationMoveBefore` / `part.operationMoveToEnd` — the RollbackBar API
- `part.getFeature` — finds features regardless of either bar's position
- `part.deleteFeature` — dangerous on rolled-back features (see deleteFeature.md)
