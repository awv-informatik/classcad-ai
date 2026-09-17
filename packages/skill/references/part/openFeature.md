# part.openFeature / part.closeFeature

Gate required before ANY `update*` call: `openFeature` makes the feature active for editing; `closeFeature` commits and recalculates geometry.

```js
await api.v1.part.openFeature({ id: featureId })
await api.v1.part.updateBox({ id: featureId, height: 120 })
await api.v1.part.closeFeature({ id: featureId }) // geometry updated — no recalc() needed
```

**Not optional.** `update*` without `openFeature` → code 1200 (maxLevel 51): "The provided feature is not allowed to update. It's not active and open."

## Key Parameters

Both take a single `id` — the **feature** ID. Accepted types: feature, workgeometry, sketch, constraint, relation. A part ID fails with "The parameter \"id\" has a wrong id type!" (message lists the accepted types) — a common mistake.

## Return Value

VOID (null). maxLevel 31 = success.

## Rules

- **One at a time.** Opening a second feature (same or different) without closing the first → maxLevel 51 (code 0): "There is still an open feature, please commit or decline the feature first."
- **Gate blocks everything.** While a feature is open, no other feature operations on the part — including creating new features. Forgetting `closeFeature` makes all subsequent feature operations fail with "still an open feature".
- **Multiple updates OK** within one open/close session; each takes effect; one `closeFeature` at the end.
- **closeFeature auto-recalculates** — no `recalc()` needed.
- **Close without open is harmless** — silent no-op (maxLevel 31).
- **Match update type to feature type.** A mismatched method (e.g. `updateBox` on a cylinder) may NOT error: shared params (`height`, `name`, `references`) silently apply to the wrong feature type; type-specific params are silently ignored.
- **Expressions work** — `@expr.` syntax in `update*` calls as in creation.

## Common Errors

| Error | Cause | Fix |
| --- | --- | --- |
| "not allowed to update. It's not active and open" | `update*` without `openFeature` | Open first |
| "still an open feature" | Second `openFeature` without closing | Close the previous feature |
| "wrong id type" | Part ID passed | Pass the feature ID |
| (silent success) | Wrong `update*` method for feature type | Use the matching method |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, height: 120, width: 100 })
await api.v1.part.closeFeature({ id: boxId }) // box now 80x100x120

// Next feature: close the previous one first, then open
const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 60, height: 50 })).result
await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, diameter: 30 })
await api.v1.part.closeFeature({ id: cylId })
```

## How It Works (GhostRollbackBar)

`openFeature` moves an internal "GhostRollbackBar" to before the target feature — NOT a node in the structure tree, tracked by `editFeatureIndex` on the OperationSequence node. `closeFeature` moves it back and recalculates downstream features. Independent of the RollbackBar (`operationMoveBefore`); see `rollback-bars.md`.

## Related

- Every `update*` API (updateBox, updateCylinder, updateWorkPlane, updateExtrusion, …) requires this pattern
- `common.recalc` — NOT needed after closeFeature or after `updateExpression` (both auto-recalc)
- `rollback-bars.md` — RollbackBar vs GhostRollbackBar
