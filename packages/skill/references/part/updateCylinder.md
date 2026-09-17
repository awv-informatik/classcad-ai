# part.updateCylinder

Updates a cylinder feature's dimensions, name, or workCSys placement. Must be wrapped in `openFeature` / `closeFeature` (close commits and recalculates geometry).

```js
await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, diameter: 80 })
await api.v1.part.closeFeature({ id: cylId })
```

## Key Parameters

- `id` — **feature ID** returned by `part.cylinder` (not the part ID)
- `name` — renames the feature node
- `diameter`, `height` — numbers, inline math (`'4*20'`, `'sqrt(10000)'`), or `@expr.NAME`. Can switch numeric ↔ expression-driven and back
- `references` — workCSys IDs. `[wcsId]` moves the cylinder there; `[]` resets to drawing origin

Omitted params keep current values; all params in one call apply together; multiple `updateCylinder` calls within one open/close session all apply (one `closeFeature` at the end). Passing the current value is harmless (result = featureId, maxLevel 31).

## Return Value

| Case | result | maxLevel | Messages |
|---|---|---|---|
| Success | feature ID | 31 | none |
| No `openFeature` | null | 51 | 1200 + 1004 |
| Zero/negative dims | feature ID (not null!) | 51 | 1122 — previous valid geometry preserved until a valid update |

## Gotchas

- **Without openFeature:** the 1004 ("id must be provided for update") is misleading — the real problem is 1200.
- **Wrong feature type:** `updateCylinder` on a non-cylinder (e.g. box) returns the feature ID with maxLevel 51 and error code 0: "Evaluation error in [Name].SetOperationParams:[Index 3 ausserhalb des Arraybereichs]" — `diameter` maps to an array index other feature types lack. Always use the matching update method.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1200 | "not allowed to update. It's not active and open" | Missing `openFeature` |
| 1004 | "id must be provided for update" | Accompanies 1200 (misleading) |
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 0 | "Evaluation error...Index 3 ausserhalb des Arraybereichs" | updateCylinder on a non-cylinder feature |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 60, height: 80 })).result
const wcsId = (await api.v1.part.workCSys({ id: partId, offset: [50, 0, 0] })).result
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'D', value: 200 }] })

await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, diameter: 120, name: 'BigCyl' })
await api.v1.part.updateCylinder({ id: cylId, references: [wcsId] }) // second call in same session applies too
await api.v1.part.updateCylinder({ id: cylId, diameter: '@expr.D' })
await api.v1.part.closeFeature({ id: cylId })
```

## Related

`part.cylinder` · `part.openFeature` / `part.closeFeature` · `part.workCSys` · `part.linkWithExpression`
