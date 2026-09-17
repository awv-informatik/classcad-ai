# solid.useSolid

Creates parametric references to solids of other features inside an entity injection (EI), for direct manipulation (booleans, transforms, …). NOT a copy — a live link: when the source feature updates (e.g. `openFeature → updateBox → closeFeature → recalc`), the referenced solids update too.

## Key Parameters

- **`from`** — feature IDs to take solids from. Two forms, **not mixable in one call** (mixing → error 1001):
  - **Plain IDs** `[featureId1, featureId2]` — takes and consumes ALL solids of each feature.
  - **Object form** `[{ id: featureId, indices: [0, 2] }]` — takes specific solids by 0-based index; consumes only those.
  - Only feature IDs (entity injections or part-level features like box, extrusion, revolve). Part or solid IDs → internal evaluation error (code 0, `OBJ_ErrorMessage`; the worker keeps running). `[]` → error 1001.
- **`in`** — destination EI ID; part IDs → error 1001. Must be created AFTER all source features.

## Return Value

`id[]` — one NEW solid ID per solid taken (different from source IDs). `[]` for an empty source feature (maxLevel=31, no error). `null` on error.

## Behavior

- **Consumption is per-solid, once.** Plain form: a second `useSolid` on the same feature fails with 1014. Object form: only the listed indices are blocked; others stay available for other EIs (e.g. take solid 0 via `{ id: srcId, indices: [0] }`, keep 1 and 2). The error message ("Entity 'X' is not available") misleadingly sounds per-entity.
- **Feature tree ordering is enforced.** Sources after the destination EI, or self-reference, fail with 1014.
- **Returned IDs are first-class** and usable immediately (no recalc) in any `solid.*` op: translation, rotation, boolean, copy, delete.
- **Source solids stay valid** — not moved or invalidated, still independently operable in their feature.
- **`consumeNeedsCopy` flag:** useSolid'd solids are marked so consuming operations (booleans) implicitly copy the geometry first, preserving the reference.
- **For an independent snapshot that doesn't update, use `solid.copy`** (e.g. copy the useSolid'd solid).
- No `updateUseSolid` / `deleteUseSolid`: delete the destination EI, or the solids via `solid.deleteSolid`.

## Common Errors

| Code | Message | Cause |
|---|---|---|
| 1014 | `Entity "X" is not available. It has already been consumed/used in another operation.` | Source solid(s) already consumed by a prior `useSolid` |
| 1014 | `Entity of operation "X" is not available. Only entities of operations which have been created before the container can be used.` | Source feature created after destination EI (or self-reference) |
| 1001 | `The parameter "in" has a wrong id type! Provide only following id types: ["entityinjection"]` | `in` is not an EI ID |
| 1001 | `An element of parameter "from" has the wrong type!` | Mixed plain IDs and objects in `from` |
| 1001 | `The parameter "from" has the wrong type! It should be of type (Array<object>\|Array<id>)` | Empty `from` array |
| 1006 | `An element of parameter "from" has an invalid id!` | Nonexistent feature ID |
| 0 | `[Evaluation error ... objId not found]` | Index out of range for the feature's solid count |
| 0 | `[Evaluation error ... OBJ_ErrorMessage ...]` | Part ID or solid ID in `from` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result

// Sources first: a part-level box feature and an EI with three solids
const boxFeat = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
const srcEif = (await api.v1.part.entityInjection({ id: partId, name: 'SrcEI' })).result
for (let i = 0; i < 3; i++) {
  await api.v1.solid.box({ id: srcEif, length: 20, width: 20, height: 20, translation: [0, 150 + i * 40, 0] })
}

// Destination EI AFTER the sources
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'WorkEI' })).result

// Plain form: all solids of the feature → new IDs
const solidIds = (await api.v1.solid.useSolid({ from: [boxFeat], in: eifId })).result
await api.v1.solid.translation({ id: eifId, target: solidIds[0], translation: [100, 0, 0] })

// Object form: only solids 0 and 2 (solid 1 stays available)
const selected = (await api.v1.solid.useSolid({ from: [{ id: srcEif, indices: [0, 2] }], in: eifId })).result
```

## Related

`solid.copy` · `solid.deleteSolid` · `part.entityInjection` · `part.box`
