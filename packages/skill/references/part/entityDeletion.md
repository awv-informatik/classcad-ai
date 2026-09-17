# part.entityDeletion

Creates a deletion feature that suppresses the solids of one or more features without removing those features from the design tree. They can be restored by updating or removing the deletion feature.

## Key Parameters

- `id` — the part ID (NOT the feature to delete)
- `targets` — array of feature IDs or `{ id, indices }` objects. **All elements must be the same format** — no mixing plain IDs with objects.
  - Plain ID or `{ id }` (no indices): deletes all solids of that feature
  - `{ id, indices: [0, 2] }`: deletes specific solid instances (0-based) of multi-solid features like linearPattern/circularPattern
- `name` — optional, default `"EntityDeletion"`

## Return Value

The ID of the new entityDeletion feature (not VOID). maxLevel 31 on success.

## Indices

0-based, matching the pattern's child instances in the structure tree (e.g. LP1_0 … LP1_3 for count=4). Deleting all indices = targeting the feature without indices.

## Gotchas

- **Cannot target consumed features.** If a feature's geometry was consumed downstream (e.g. a box consumed by a linearPattern) → error 1014 "Entity 'X' is not available. It has already been consumed/used in another operation." Target the consuming feature instead.
- **Cannot mix target formats.** `[cylId, { id: patternId, indices: [1] }]` fails with code 1001. Use all-objects: `[{ id: cylId }, { id: patternId, indices: [1] }]`.
- **Empty targets array fails** with "The type '0' is not supported in PrepareAPIParams!" — not a graceful empty set.
- **Renderer may show stale data.** STEP export reflects the true state (0 bodies after deleting all), but PNG snapshots may still show the deleted geometry.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "ToId()/TOID() didn't get an existing or valid id." | — | Invalid feature ID in targets |
| "Entity 'X' is not available..." | 1014 | Feature consumed by downstream operation |
| "An element of parameter 'targets' has the wrong type!" | 1001 | Mixed plain IDs and objects in targets |
| "The type '0' is not supported in PrepareAPIParams!" | 1004 | Empty targets array or null value |
| "[Evaluation error...objId not found]" | — | Out-of-range index for the feature |

## part.updateEntityDeletion

Changes which targets/indices are suppressed. **Replaces** the entire targets list — not additive. Requires `part.openFeature` on the deletion feature first and `closeFeature` after.

- `id` — the entityDeletion feature ID (NOT the part ID)
- `targets` — new list (same format rules as `entityDeletion`)
- `name` — optional rename

Returns the entityDeletion feature ID, maxLevel 31.

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const box1 = (await api.v1.part.box({ id: partId, length: 60, width: 40, height: 30 })).result
const box2 = (await api.v1.part.box({ id: partId, length: 20, width: 20, height: 80 })).result
const cylId = (await api.v1.part.cylinder({ id: partId, diameter: 20, height: 60 })).result
const waX = (await api.v1.part.workAxis({ id: partId, position: [0, 0, 0], direction: [1, 0, 0] })).result

// Delete a whole feature
const delId = (await api.v1.part.entityDeletion({ id: partId, name: 'RemoveBox2', targets: [box2] })).result

// Pattern of 5 (consumes box1), then delete whole cylinder + pattern instances 1 and 3 (all-objects format)
const patternId = (await api.v1.part.linearPattern({
  id: partId, targets: [box1],
  dir1: { references: [waX], distance: 80, count: 5 },
})).result
const delId2 = (await api.v1.part.entityDeletion({
  id: partId,
  targets: [{ id: cylId }, { id: patternId, indices: [1, 3] }],
})).result

// Update: replace the targets — now instances 0 and 4
await api.v1.part.openFeature({ id: delId2 })
await api.v1.part.updateEntityDeletion({
  id: delId2,
  targets: [{ id: cylId }, { id: patternId, indices: [0, 4] }],
})
await api.v1.part.closeFeature({ id: delId2 })
```

## Related

`part.linearPattern` / `part.circularPattern` · `part.openFeature` / `part.closeFeature`
