# part.updateTransformationByCSys

Updates an existing transformationByCSys feature's targets, references, or name. Must be wrapped in `openFeature` / `closeFeature` (else error 1200).

## Key Parameters

- `id` — **transformationByCSys feature ID** (not the part)
- `targets` — optional new feature IDs. Changing targets reverts previous targets to their pre-transform positions.
- `references` — optional new `[toWCS, fromWCS]`
- `name` — optional

Omitted values keep existing settings.

## Return Value

Feature ID (same as input), maxLevel=31. null with maxLevel=51 on error.

## Gotchas

- **Cannot reference WCS created after `openFeature`.** The GhostRollbackBar rolls the model back, so a WCS created in that state isn't a valid reference. Create all WCS before the transform feature.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'TransformUpd' })).result
const boxId = (await api.v1.part.box({ id: partId, length: 40, width: 30, height: 20 })).result
// All WCS must exist BEFORE the transform feature
const wcsFrom = (await api.v1.part.workCSys({ id: partId, name: 'From', offset: [0, 0, 0] })).result
const wcsTo1 = (await api.v1.part.workCSys({ id: partId, name: 'To1', offset: [50, 0, 0] })).result
const wcsTo2 = (await api.v1.part.workCSys({ id: partId, name: 'To2', offset: [0, 50, 0] })).result

const tId = (await api.v1.part.transformationByCSys({
  id: partId, targets: [boxId], references: [wcsTo1, wcsFrom],
})).result

await api.v1.part.openFeature({ id: tId })
await api.v1.part.updateTransformationByCSys({ id: tId, references: [wcsTo2, wcsFrom] })
await api.v1.part.closeFeature({ id: tId })
```

## Related

`part.transformationByCSys` · `part.openFeature` / `part.closeFeature`
