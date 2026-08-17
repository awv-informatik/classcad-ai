# part.updateTransformationByCSys

Updates an existing transformationByCSys feature. Can change targets, references, or name.

## Prerequisites

- An existing `transformationByCSys` feature
- The feature must be opened with `openFeature` before updating and closed with `closeFeature` after
- Any WCS references used in the update must already exist in the feature tree BEFORE the transform feature

## Key Parameters

- `id` — **feature ID** (the transformationByCSys feature, not the part)
- `targets` — (optional) new array of feature IDs to transform
- `references` — (optional) new pair of WCS IDs `[toWCS, fromWCS]`
- `name` — (optional) new feature name

All parameters except `id` are optional — omitted values keep existing settings.

## Return Value

Feature ID (same as input) on success, maxLevel=31. Returns null with maxLevel=51 on error.

## Gotchas

- **Must wrap with `openFeature`/`closeFeature`.** Without it: error 1200.
- **Cannot reference WCS created after `openFeature`.** The GhostRollbackBar rolls back the model state — any WCS created in the rolled-back state won't be recognized as a valid reference. Create all WCS before the transform feature.
- **Changing targets reverts previous targets** to their pre-transform positions.

## Working Example

```js
// All WCS must exist BEFORE the transform feature
const wcsFrom = (await api.v1.part.workCSys({ id: partId, name: 'From', offset: [0,0,0] })).result
const wcsTo1 = (await api.v1.part.workCSys({ id: partId, name: 'To1', offset: [50,0,0] })).result
const wcsTo2 = (await api.v1.part.workCSys({ id: partId, name: 'To2', offset: [0,50,0] })).result

const tId = (await api.v1.part.transformationByCSys({
  id: partId, targets: [boxId], references: [wcsTo1, wcsFrom],
})).result

// Update references
await api.v1.part.openFeature({ id: tId })
await api.v1.part.updateTransformationByCSys({ id: tId, references: [wcsTo2, wcsFrom] })
await api.v1.part.closeFeature({ id: tId })
```

## Related

- `part.transformationByCSys` — create the feature this updates
- `part.openFeature` / `part.closeFeature` — required wrapping for updates
