# part.openFeature / part.closeFeature

Gate pattern required before ANY `update*` API call. `openFeature` sets the feature as active for editing; `closeFeature` commits changes and recalculates geometry.

## Prerequisites

- A part with at least one feature (box, cylinder, workPlane, etc.)
- The feature ID (not the part ID)

## The Pattern

```js
await api.v1.part.openFeature({ id: featureId })
await api.v1.part.updateBox({ id: featureId, height: 120 })
await api.v1.part.closeFeature({ id: featureId })
// geometry is now updated — no recalc() needed
```

**This is not optional.** Calling any `update*` without `openFeature` first produces error 51: "The provided feature is not allowed to update. It's not active and open."

## Key Parameters

Both take a single `id` parameter — the feature ID to open/close.

**Accepted ID types:** feature, workgeometry, sketch, constraint, relation. Passing a part ID fails with: "The parameter \"id\" has a wrong id type!"

## Return Value

Both return VOID (null). Check `maxLevel` for errors. maxLevel 31 = success.

## Rules

- **One at a time.** Only ONE feature can be open at any time. Opening a second feature (same or different) without closing the first produces error 51: "There is still an open feature, please commit or decline the feature first."
- **Gate blocks everything.** While a feature is open, you cannot create new features either — not just updates. The gate blocks all feature operations on the part.
- **Multiple updates OK.** You can call `update*` multiple times within a single open/close session. Each call takes effect. Only one `closeFeature` needed at the end.
- **closeFeature auto-recalculates.** No need to call `recalc()` after closing — geometry is immediately up to date.
- **Close without open is harmless.** Calling `closeFeature` on a feature that isn't open is a silent no-op (maxLevel 31).
- **Match update type to feature type.** Calling a mismatched update method (e.g., `updateBox` on a cylinder) may NOT error — shared param names (`height`, `name`, `references`) silently apply to the wrong feature type. Feature-type-specific params are silently ignored. Always use the matching update method to avoid unintended side effects.
- **Expressions work in updates.** `@expr.` syntax works in `update*` calls just like in creation calls.

## Gotchas

- Passing the **part ID** instead of the **feature ID** to `openFeature` is a common mistake. The error message is clear: it lists the accepted ID types.
- Forgetting `closeFeature` leaves the gate locked. All subsequent feature operations will fail with "still an open feature" until you close.
- Wrong `update*` type on a feature does NOT always error — shared params (height, name, references) silently apply. Use the matching update method.

## Common Errors

| Error | Cause | Fix |
| --- | --- | --- |
| "not allowed to update. It's not active and open" | `update*` without `openFeature` | Add `openFeature` before the update |
| "still an open feature" | Second `openFeature` without closing first | Close the previous feature first |
| "wrong id type" | Part ID passed to `openFeature` | Pass the feature ID, not the part ID |
| (no error — silent success) | Wrong `update*` method for feature type | Shared params apply silently; use matching method |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

// Update box height: open → update → close
await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, height: 120, width: 100 })
await api.v1.part.closeFeature({ id: boxId })
// box is now 80x100x120, geometry recalculated

// Sequential edits on different features: close first, then open next
const cylId = (await api.v1.part.cylinder({ id: partId, radius: 30, height: 50 })).result
await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, radius: 15 })
await api.v1.part.closeFeature({ id: cylId })
```

## Related

- Every `update*` API (updateBox, updateCylinder, updateWorkPlane, updateExtrusion, etc.) requires this pattern
- `common.recalc` — NOT needed after closeFeature (it auto-recalcs) or after `updateExpression` (also auto-recalcs)
