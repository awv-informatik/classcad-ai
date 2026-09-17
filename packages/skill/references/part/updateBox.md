# part.updateBox

Updates a box feature's dimensions, name, or workCSys placement. Must be wrapped in `openFeature` / `closeFeature` (close commits and recalculates geometry).

```js
await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, height: 200 })
await api.v1.part.closeFeature({ id: boxId })
```

## Key Parameters

- `id` — **feature ID** returned by `part.box` (not the part ID)
- `name` — renames the feature node. Body child keeps the original name with `_0` suffix (e.g. `OrigBox_0` stays after renaming to `NewBoxName`)
- `length`, `width`, `height` — numbers, inline math (`'3*25'`, `'sqrt(2500)'`), or `@expr.NAME`. Can switch numeric ↔ expression-driven and back
- `references` — workCSys IDs. `[wcsId]` moves the box there; `[]` resets to drawing origin

Omitted params keep current values; all params in one call apply together; multiple `updateBox` calls within one open/close session all apply (one `closeFeature` at the end). Passing the current value is harmless (result = featureId, maxLevel 31).

## Return Value

| Case | result | maxLevel | Messages |
|---|---|---|---|
| Success | feature ID | 31 | none |
| No `openFeature` | null | 51 | 1200 + 1004 |
| Zero/negative dims | feature ID (not null!) | 51 | 1122 — previous valid geometry preserved until a valid update |

## Gotchas

- **Without openFeature:** the 1004 ("id must be provided for update") is misleading — the real problem is 1200.
- **Wrong feature type:** `updateBox` on a non-box feature (e.g. cylinder) does NOT error. Shared params (`height`, `name`, `references`) actually apply to that feature; `length`/`width` are silently ignored; the feature keeps its type. Always use the matching update method.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1200 | "not allowed to update. It's not active and open" | Missing `openFeature` |
| 1004 | "id must be provided for update" | Accompanies 1200 (misleading) |
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 1000 | "Could not convert api params" | `@expr.` pointing to a non-existent expression |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
const wcsId = (await api.v1.part.workCSys({ id: partId, offset: [50, 0, 0] })).result
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'H', value: 200 }] })

await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, height: 120, name: 'TallBox' })
await api.v1.part.updateBox({ id: boxId, references: [wcsId] }) // second call in same session applies too
await api.v1.part.updateBox({ id: boxId, height: '@expr.H' }) // numeric → expression
await api.v1.part.closeFeature({ id: boxId })
```

## Related

`part.box` · `part.openFeature` / `part.closeFeature` · `part.workCSys` · `part.linkWithExpression`
