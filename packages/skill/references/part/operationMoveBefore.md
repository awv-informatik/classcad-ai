# part.operationMoveBefore / part.operationMoveToEnd

Controls the rollback bar position in the design tree. `operationMoveBefore` moves the bar to just before a specified feature, hiding/deactivating all features at and after that position. `operationMoveToEnd` moves the bar to the end, restoring all features.

## Prerequisites

- A part (`part.create`)
- At least one feature in the design tree (moveToEnd also works on an empty part — silent no-op)

## Key Parameters

### operationMoveBefore

- `id` — the **part** ID (not a feature ID)
- `featureId` — the feature/workgeometry/sketch ID to move the bar before. Accepted types: `feature`, `workgeometry`, `sketch`. Passing a part ID gives error 1001.

### operationMoveToEnd

- `id` — the **part** ID

## Return Value

Both return VOID (null). Check `maxLevel` — 31 = success.

## How It Works

The CC_RollbackBar is a node in the OperationSequence that physically moves position within the children array. Features after the bar are not evaluated but remain in the structure tree. All nodes survive — nothing is deleted.

```
Before: BoxRef → CylRef → RollbackBar           (all active)
After moveBefore(cylId): BoxRef → RollbackBar → CylRef  (cyl hidden)
After moveToEnd: BoxRef → CylRef → RollbackBar           (all active again)
```

## Primary Use Case: Insert Features Mid-Tree

```js
// Design tree: Box → Cylinder → Boolean(subtraction)
// Want to insert a sphere BEFORE the boolean

await api.v1.part.operationMoveBefore({ id: partId, featureId: boolId })
// Bar is now before boolean — only box + cyl are active

const sphereId = (await api.v1.part.sphere({ id: partId, radius: 12, position: [-20, 10, 20] })).result
// Sphere is created at the bar position (before the boolean)

await api.v1.part.operationMoveToEnd({ id: partId })
// Full tree: Box → Cyl → Sphere → Boolean — all re-evaluated
```

## Behavior Rules

- **Idempotent.** Calling moveBefore on the same position twice is a silent no-op (maxLevel 31).
- **moveToEnd when already at end** is also a silent no-op.
- **Backward moves** (toward start) hide features immediately — no recalc.
- **Forward moves** (toward end) trigger recalculation of the features being restored. Changes made via `openFeature`/`updateBox`/`closeFeature` at mid-tree propagate through downstream features (booleans, patterns) on moveToEnd.
- **open/close without changes** + moveToEnd is fine — no unnecessary recalc, silent success.
- **Feature creation at mid-tree** inserts the new feature at the bar's current position, not at the end.
- **Default work geometry** (Top, Front, Right, XAxis, etc.) can be targeted — the bar can go before built-in planes.

## Interaction with Other APIs

- **`getFeature`** — NOT affected by bar position. Finds features even when rolled back.
- **`openFeature`** — works on both rolled-back and visible features. Not blocked by bar position.
- **`updateBox`/etc.** — works on visible features while bar is mid-tree.
- **Booleans** — rolling back past a boolean undoes the boolean (shows separate pre-boolean bodies).

## Error Handling

### operationMoveBefore errors

| Input | Code | Error |
|---|---|---|
| `featureId: partId` (wrong type) | 1001 | `"has a wrong id type! Provide only following id types: [\"feature\",\"workgeometry\",\"sketch\"]"` |
| `featureId: 999999` (nonexistent) | 1006 | `"has an invalid id!"` |

### operationMoveToEnd errors

| Input | Code | Error |
|---|---|---|
| `id: featureId` (wrong type) | 1001 | `"has a wrong id type! Provide only following id types: [\"part\"]"` |
| `id: 999999` (nonexistent) | 1006 | `"has an invalid id!"` |
| `id: 0` | 1006 | `"has an invalid id!"` |
| `{}` (missing id) | 1004 | `"must be provided in the api call!"` |

## Gotchas

- **moveBefore:** `featureId` must be a feature/workgeometry/sketch ID, NOT a part ID.
- **moveToEnd:** `id` must be a part ID, NOT a feature ID.
- The structure tree always shows ALL features regardless of bar position. Use the RollbackBar's position in the OperationSequence children to determine which features are active.
- When inserting features mid-tree, downstream features (like booleans) are re-evaluated on moveToEnd. If the inserted feature breaks a downstream dependency, the downstream feature may fail.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60 })).result

// Roll back before cylinder — only box visible
await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })

// Restore all features
await api.v1.part.operationMoveToEnd({ id: partId })
```

## Related

- `part.openFeature` / `part.closeFeature` — the editing gate (uses GhostRollbackBar, a different mechanism)
- `rollback-bars.md` — RollbackBar vs GhostRollbackBar conceptual overview
- `part.getFeature` — find features by name (works regardless of bar position)
- `part.deleteFeature` — permanently removes features (vs moveBefore which just hides them)
