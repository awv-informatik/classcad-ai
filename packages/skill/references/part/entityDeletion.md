# part.entityDeletion

Suppresses geometry from one or more features without removing the features from the design tree. Creates a deletion feature that hides targeted solids. The original features remain in the tree and can be restored by updating or removing the deletion feature.

## Prerequisites

- A part (`part.create`)
- One or more features with geometry to delete (box, cylinder, extrusion, pattern, etc.)

## Key Parameters

- `id` — the part ID (NOT the feature to delete)
- `targets` — array of feature IDs or objects with `{ id, indices }`. **All elements must be the same format** — cannot mix plain IDs with objects.
  - Plain ID: deletes all solids from that feature
  - `{ id }` (object, no indices): same as plain ID — deletes all solids
  - `{ id, indices: [0, 2] }`: deletes specific solid instances (0-based). Used for multi-solid features like linearPattern/circularPattern.
- `name` — optional, defaults to `"EntityDeletion"`

## Return Value

Returns the ID of the newly created entityDeletion feature (not VOID). maxLevel 31 on success.

## Gotchas

- **Cannot target consumed features.** If a feature's geometry has been consumed by a downstream feature (e.g., a box consumed by a linearPattern), you get error code 1014: "Entity 'X' is not available. It has already been consumed/used in another operation." Target the consuming feature instead.
- **Cannot mix target formats.** Passing `[cylId, { id: patternId, indices: [1] }]` fails with code 1001. Use all-objects format instead: `[{ id: cylId }, { id: patternId, indices: [1] }]`.
- **Empty targets array fails** with "The type '0' is not supported in PrepareAPIParams!" — not a graceful empty-set.
- **Renderer may show stale data** after entityDeletion. STEP export reflects the true state (0 bodies after deleting all), but PNG snapshots may still show the deleted geometry.

## Indices

Indices are 0-based and correspond to the pattern's child instances in the structure tree (e.g., LP1_0, LP1_1, LP1_2, LP1_3 for a count=4 pattern). Deleting all indices produces the same result as targeting the feature without indices.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "ToId()/TOID() didn't get an existing or valid id." | — | Invalid feature ID in targets |
| "Entity 'X' is not available..." | 1014 | Feature consumed by downstream operation |
| "An element of parameter 'targets' has the wrong type!" | 1001 | Mixed plain IDs and objects in targets |
| "The type '0' is not supported in PrepareAPIParams!" | 1004 | Empty targets array or null value |
| "[Evaluation error...objId not found]" | — | Out-of-range index for the feature |

## Working Example

```js
// Delete a single feature
const partId = (await api.v1.part.create({})).result
const box1 = (await api.v1.part.box({ id: partId, length: 60, width: 40, height: 30 })).result
const box2 = (await api.v1.part.box({ id: partId, references: [wcsId] })).result
const delId = (await api.v1.part.entityDeletion({
  id: partId,
  name: 'RemoveBox2',
  targets: [box2]
})).result

// Delete specific pattern instances
const patternId = (await api.v1.part.linearPattern({
  id: partId, targets: [box1],
  dir1: { references: [waId], distance: 40, count: 5 }
})).result
const delId2 = (await api.v1.part.entityDeletion({
  id: partId,
  targets: [{ id: patternId, indices: [1, 3] }]
})).result

// Mix simple + indexed deletion (all-objects format)
const delId3 = (await api.v1.part.entityDeletion({
  id: partId,
  targets: [{ id: cylId }, { id: patternId, indices: [2] }]
})).result
```

## Related

- `part.updateEntityDeletion` — modify targets after creation (requires open/close gate)
- `part.linearPattern` / `part.circularPattern` — primary use case for indexed deletion
- `part.openFeature` / `part.closeFeature` — required gate for updates

# part.updateEntityDeletion

Updates an existing entityDeletion feature to change which targets/indices are suppressed. **Replaces** the entire targets list — not additive.

## Prerequisites

- An existing entityDeletion feature
- `part.openFeature` called on the deletion feature ID

## Key Parameters

- `id` — the entityDeletion feature ID (NOT the part ID)
- `targets` — new targets list (same format rules as `entityDeletion`)
- `name` — optional, rename the deletion feature

## Return Value

Returns the entityDeletion feature ID on success. maxLevel 31.

## Working Example

```js
// Change deleted indices from [1,3] to [0,4]
await api.v1.part.openFeature({ id: delId })
await api.v1.part.updateEntityDeletion({
  id: delId,
  targets: [{ id: patternId, indices: [0, 4] }]
})
await api.v1.part.closeFeature({ id: delId })
```
