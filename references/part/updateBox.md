# part.updateBox

Updates an existing box feature's dimensions, name, or coordinate system placement. Requires the open/close pattern.

## Prerequisites

- A box feature created with `part.box` (you need the feature ID it returned)
- `openFeature` called on that feature ID before updating
- `closeFeature` called after updating (commits changes + recalculates geometry)

## The Pattern

```js
await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, height: 200 })
await api.v1.part.closeFeature({ id: boxId })
```

## Key Parameters

- `id` — **feature ID** returned by `part.box` (not the part ID)
- `name` — renames the feature tree node. Body child retains the original name with `_0` suffix (e.g., `OrigBox_0` stays even after renaming to `NewBoxName`)
- `length`, `width`, `height` — new dimensions. Omitted params keep existing values. Accept numbers, inline math strings (`'3*25'`, `'sqrt(2500)'`), or `@expr.NAME` references
- `references` — array of workCSys IDs. `[wcsId]` moves box to that WCS. `[]` (empty array) resets to drawing origin

## Return Value

- **Success:** feature ID (numeric), maxLevel 31, empty messages
- **Failure (no openFeature):** null, maxLevel 51, errors 1200 + 1004
- **Failure (zero/negative dims):** feature ID (not null!), maxLevel 51, error 1122. Feature keeps previous valid geometry

## Behaviors

- **Partial update:** omit any param to keep its current value. Only specified params change.
- **Multi-param:** all params in one call apply together.
- **Sequential updates:** multiple `updateBox` calls within a single `openFeature`/`closeFeature` session all apply. Only one `closeFeature` needed at the end.
- **Noop update:** passing the same value as current is harmless (result=featureId, maxLevel=31).
- **Expressions:** `@expr.NAME` references work. You can switch a param from numeric to expression-driven and back. Inline math (`'3*25'`) also works.

## Gotchas

- **Without openFeature:** returns null + two errors: 1200 ("not active and open") and 1004 ("id must be provided for update"). The 1004 is misleading — the actual problem is 1200.
- **Name vs body name:** `updateBox({ name: 'NewName' })` renames the feature node but NOT the internal body child (stays `OriginalName_0`).
- **Wrong feature type:** `updateBox` on a non-box feature (e.g., cylinder) does NOT error. Shared param names (`height`, `name`, `references`) actually apply to the target feature. Box-specific params (`length`, `width`) are silently ignored. The feature retains its original type. Always use the matching update method (`updateCylinder` for cylinders, etc.).
- **Zero/negative dims:** returns feature ID with error 1122 — feature exists but has invalid geometry. Previous valid geometry is preserved until a valid update.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1200 | "not allowed to update. It's not active and open" | Missing `openFeature` before update |
| 1004 | "id must be provided for update" | Accompanies 1200 (misleading — id was provided) |
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 1000 | "Could not convert api params" | Invalid expression reference (e.g., `@expr.` pointing to non-existent expression) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const boxId = (await api.v1.part.box({
  id: partId, name: 'Box1', length: 80, width: 60, height: 40,
})).result

// Update height and rename
await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, height: 120, name: 'TallBox' })
await api.v1.part.closeFeature({ id: boxId })

// Move box to a WCS
const wcsId = (await api.v1.part.workCSys({
  id: partId, origin: [50, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result
await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, references: [wcsId] })
await api.v1.part.closeFeature({ id: boxId })

// Switch to expression-driven dimensions
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 200 }] })
await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, height: '@expr.H' })
await api.v1.part.closeFeature({ id: boxId })
```

## Related

- `part.box` — create the box feature this updates
- `part.openFeature` / `part.closeFeature` — required gate pattern
- `part.workCSys` — create coordinate systems for `references`
- `part.linkWithExpression` — alternative way to bind expressions post-hoc
