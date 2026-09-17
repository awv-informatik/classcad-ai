# RollbackBar vs GhostRollbackBar

The design tree has **two** independent rollback mechanisms controlling which features are active and editable.

## The Two Bars

| | RollbackBar (persistent history position) | GhostRollbackBar (temporary edit context) |
|---|---|---|
| Node | `CC_RollbackBar` (id=20 in a fresh part), physical node in the OperationSequence | None — NOT in the structure tree |
| Controlled by | `operationMoveBefore` / `operationMoveToEnd` | `openFeature` / `closeFeature` |
| Purpose | Features after the bar are deactivated (not evaluated); before it are live | Exclusive editing context for one feature |
| Observable | Bar's position in OperationSequence `children` | `editFeatureIndex` on OperationSequence (index into `children`; `-1` = none open) |
| Create features | ✅ At bar position | ❌ Blocked |
| Update the specific feature | ❌ Needs openFeature | ✅ Opened feature only |
| Update other features | ❌ | ❌ |
| Move RollbackBar | ✅ | ✅ (works while a feature is open) |
| Structure change | Children array reordered | None (only editFeatureIndex) |
| Recalc trigger | `moveToEnd` replays features | `closeFeature` recalculates downstream |

## How to Observe Both

OperationSequence node (id=18) members:

```
editFeatureIndex: -1      ← GhostRollbackBar (-1 = inactive)
isDirty: 0                ← updates made during current edit session
_VERSION: "2/2020_..."    ← internal version
```

```
RollbackBar (id=20 in children; everything after it is deactivated):
  Default:              [..., BoxRef, CylRef, SphRef, RollbackBar]
  After moveBefore(cyl): [..., BoxRef, RollbackBar, CylRef, SphRef]

GhostRollbackBar:
  Nothing open:     editFeatureIndex = -1
  openFeature(box): editFeatureIndex = 7  (children[7] = BoxRef)
  openFeature(cyl): editFeatureIndex = 8  (children[8] = CylRef)
```

## Independence

- `operationMoveBefore`/`operationMoveToEnd` work while a feature is open
- `openFeature` works on features behind the RollbackBar
- Both can be active simultaneously at different positions — valid and well-defined, no interference

## Mid-Tree Editing (primary use of openFeature)

```js
// Tree: Box → Cylinder → Boolean(subtraction); resize Box without breaking the Boolean
await api.v1.part.openFeature({ id: boxId })             // Ghost → before Box
await api.v1.part.updateBox({ id: boxId, height: 120 })
await api.v1.part.closeFeature({ id: boxId })            // Ghost back; Boolean recalculates
```

The alternative (moveBefore Box → delete Box → recreate → moveToEnd and hope the Boolean re-resolves) risks breaking downstream references; `openFeature` avoids this.

## isDirty Semantics

- Becomes `1` when `update*` is called in an open session
- Resets to `0` when `closeFeature` is called with the RollbackBar at the end (full recalc), or when `operationMoveToEnd` replays features past the modified point
- Stays `1` after `closeFeature` if the RollbackBar is mid-tree — full recalc deferred; you must `moveToEnd` to replay

## Gotchas

- **GhostRollbackBar is invisible** — only `editFeatureIndex` reveals it.
- **openFeature blocks everything except updates to the target** — no creation, no editing other features, even if the RollbackBar was moved to allow creation.

## Related

`part.openFeature` / `part.closeFeature` · `part.operationMoveBefore` / `part.operationMoveToEnd` · `part.getFeature` · `part.deleteFeature`
