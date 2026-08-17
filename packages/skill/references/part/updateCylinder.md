# part.updateCylinder

Updates an existing cylinder feature's dimensions, name, or coordinate system placement. Requires the open/close pattern.

## Prerequisites

- A cylinder feature created with `part.cylinder` (you need the feature ID it returned)
- `openFeature` called on that feature ID before updating
- `closeFeature` called after updating (commits changes + recalculates geometry)

## The Pattern

```js
await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, diameter: 80 })
await api.v1.part.closeFeature({ id: cylId })
```

## Key Parameters

- `id` — **feature ID** returned by `part.cylinder` (not the part ID)
- `name` — renames the feature tree node
- `diameter`, `height` — new dimensions. Omitted params keep existing values. Accept numbers, inline math strings (`'4*20'`, `'sqrt(10000)'`), or `@expr.NAME` references
- `references` — array of workCSys IDs. `[wcsId]` moves cylinder to that WCS. `[]` (empty array) resets to drawing origin

## Return Value

- **Success:** feature ID (numeric), maxLevel 31, empty messages
- **Failure (no openFeature):** null, maxLevel 51, errors 1200 + 1004
- **Failure (zero/negative dims):** feature ID (not null!), maxLevel 51, error 1122. Feature keeps previous valid geometry

## Behaviors

- **Partial update:** omit any param to keep its current value. Only specified params change.
- **Multi-param:** all params in one call apply together.
- **Sequential updates:** multiple `updateCylinder` calls within a single `openFeature`/`closeFeature` session all apply. Only one `closeFeature` needed at the end.
- **Noop update:** passing the same value as current is harmless (result=featureId, maxLevel=31).
- **Expressions:** `@expr.NAME` references work. You can switch a param from numeric to expression-driven and back. Inline math (`'4*20'`) also works.

## Gotchas

- **Without openFeature:** returns null + two errors: 1200 ("not active and open") and 1004 ("id must be provided for update"). The 1004 is misleading — the actual problem is 1200.
- **Wrong feature type:** `updateCylinder` on a non-cylinder feature (e.g., box) produces error code 0 with internal message "Evaluation error in [Name].SetOperationParams:[Index 3 ausserhalb des Arraybereichs]". The cylinder-specific `diameter` param maps to an array index that doesn't exist on other feature types. Feature ID is returned but with maxLevel 51. Always use the matching update method (`updateBox` for boxes, etc.).
- **Zero/negative dims:** returns feature ID with error 1122 — feature exists but has invalid geometry. Previous valid geometry is preserved until a valid update.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1200 | "not allowed to update. It's not active and open" | Missing `openFeature` before update |
| 1004 | "id must be provided for update" | Accompanies 1200 (misleading — id was provided) |
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 0 | "Evaluation error...Index 3 ausserhalb des Arraybereichs" | Used updateCylinder on a non-cylinder feature |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const cylId = (await api.v1.part.cylinder({
  id: partId, name: 'Cyl1', diameter: 60, height: 80,
})).result

// Update diameter and rename
await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, diameter: 120, name: 'BigCyl' })
await api.v1.part.closeFeature({ id: cylId })

// Move cylinder to a WCS
const wcsId = (await api.v1.part.workCSys({
  id: partId, origin: [50, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result
await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, references: [wcsId] })
await api.v1.part.closeFeature({ id: cylId })

// Switch to expression-driven dimensions
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'D', value: 200 }] })
await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, diameter: '@expr.D' })
await api.v1.part.closeFeature({ id: cylId })
```

## Related

- `part.cylinder` — create the cylinder feature this updates
- `part.openFeature` / `part.closeFeature` — required gate pattern
- `part.workCSys` — create coordinate systems for `references`
- `part.linkWithExpression` — alternative way to bind expressions post-hoc
