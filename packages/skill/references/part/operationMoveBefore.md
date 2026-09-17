# part.operationMoveBefore / part.operationMoveToEnd

Control the rollback bar in the design tree. `operationMoveBefore` moves it just before a feature, deactivating that feature and everything after. `operationMoveToEnd` moves it to the end, restoring all features.

## Key Parameters

| Method | Param | Notes |
|---|---|---|
| `operationMoveBefore` | `id` | **part** ID |
| | `featureId` | types `feature`, `workgeometry`, `sketch` (part ID → 1001) |
| `operationMoveToEnd` | `id` | **part** ID (NOT a feature ID); works on an empty part (silent no-op) |

## Return Value

VOID (null). maxLevel 31 = success.

## How It Works

CC_RollbackBar is a node in the OperationSequence that physically moves within the children array. Features after it are not evaluated but stay in the structure tree — nothing is deleted. The tree always shows ALL features; the bar's position among the children tells which are active.

```
Before:                  BoxRef → CylRef → RollbackBar   (all active)
After moveBefore(cylId): BoxRef → RollbackBar → CylRef   (cyl hidden)
After moveToEnd:         BoxRef → CylRef → RollbackBar   (all active)
```

## Behavior Rules

- **Idempotent** — moveBefore to the same position twice, or moveToEnd when already at end: silent no-op (maxLevel 31).
- **Backward moves** hide features immediately — no recalc.
- **Forward moves** recalc the restored features. Mid-tree changes via `openFeature`/`updateBox`/`closeFeature` propagate through downstream features (booleans, patterns) on moveToEnd. open/close without changes + moveToEnd: no unnecessary recalc, silent success.
- **Feature creation** while mid-tree inserts at the bar position, not at the end.
- **Default work geometry** (Top, Front, Right, XAxis, …) can be targeted.
- **`getFeature`** is NOT affected by bar position (finds rolled-back features).
- **`openFeature`** works on rolled-back and visible features; `updateBox` etc. work on visible features while the bar is mid-tree.
- **Booleans** — rolling back past a boolean undoes it (separate pre-boolean bodies shown).
- If an inserted feature breaks a downstream dependency, that downstream feature may fail on moveToEnd.

## Common Errors

| Method | Input | Code | Error |
|---|---|---|---|
| moveBefore | `featureId: partId` | 1001 | `"has a wrong id type! Provide only following id types: [\"feature\",\"workgeometry\",\"sketch\"]"` |
| moveBefore | `featureId: 999999` | 1006 | `"has an invalid id!"` |
| moveToEnd | `id: featureId` | 1001 | `"has a wrong id type! Provide only following id types: [\"part\"]"` |
| moveToEnd | `id: 999999` or `id: 0` | 1006 | `"has an invalid id!"` |
| moveToEnd | `{}` | 1004 | `"must be provided in the api call!"` |

## Working Example

Insert a feature mid-tree (before a boolean):

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 40, height: 60 })).result
const boolId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: boxId, tools: [cylId] })).result

// Bar before the boolean — only box + cyl active
await api.v1.part.operationMoveBefore({ id: partId, featureId: boolId })

// Created at the bar position (before the boolean)
const sphereCS = (await api.v1.part.workCSys({ id: partId, name: 'SphereCS', offset: [-20, 10, 20] })).result
await api.v1.part.sphere({ id: partId, radius: 12, references: [sphereCS] })

// Box → Cyl → Sphere → Boolean — all re-evaluated
await api.v1.part.operationMoveToEnd({ id: partId })
```

## Related

`part.openFeature` / `part.closeFeature` · `rollback-bars.md` · `part.getFeature` · `part.deleteFeature`
