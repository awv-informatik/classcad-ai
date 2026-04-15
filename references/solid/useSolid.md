# solid.useSolid

Creates parametric references to solids from other features, making them available for direct manipulation inside an entity injection. This is NOT a copy — it's a live link. When the source feature updates, the referenced solids update too.

## Prerequisites

- A part (`part.create`)
- One or more source features containing solids (entity injections, `part.box`, `part.extrusion`, etc.)
- A destination entity injection (`part.entityInjection`) — must be created AFTER the source features in the feature tree

## Key Parameters

- **`from`** — array of feature IDs to get solids from. Two forms, **cannot be mixed in the same call**:
  - **Plain IDs:** `[featureId1, featureId2]` — pulls ALL solids from each feature. Consumes all solids.
  - **Object form:** `[{ id: featureId, indices: [0, 2] }]` — pulls specific solids by 0-based index. Only consumes the specified indices.
- **`in`** — destination entity injection feature ID. Must be an EI — part IDs are rejected with error 1001.

## Return Value

Returns `id[]` — array of new solid IDs created in the destination EI. One ID per solid pulled. These are NEW IDs (different from the source solid IDs). Returns `[]` for empty sources. Returns `null` on error.

## Behavior

- **Parametric link, not a copy.** When the source feature is updated (e.g., `openFeature → updateBox → closeFeature → recalc`), the useSolid'd reference updates to reflect the new geometry. Fundamentally different from `solid.copy`.
- **Consumption is per-solid.** Each solid in a source feature can only be consumed by `useSolid` once. After consumption:
  - Plain ID form: all solids consumed. A second `useSolid` on the same feature fails with code 1014.
  - Object form with `indices`: only specified indices are consumed. Other indices remain available for future `useSolid` calls.
- **Feature tree ordering.** Source features must be created BEFORE the destination EI in the feature tree. Self-reference and backward references fail with code 1014.
- **Returned IDs are first-class.** They work in any `solid.*` operation: translation, rotation, boolean, copy, delete, etc.
- **Original solid IDs remain valid.** The source solids are not moved or invalidated — they still exist in their original feature and can be independently operated on.
- **`consumeNeedsCopy` flag.** Internally, useSolid'd solids are marked so that consuming operations (booleans) implicitly copy the geometry first, preserving the parametric reference.

## Gotchas

- **Cannot mix plain IDs and objects in `from`.** `from: [featureId, { id: otherId, indices: [0] }]` fails with error 1001. Use one form exclusively.
- **Passing part IDs or solid IDs in `from` causes an internal server crash** (code 0, not a clean error message). Only pass feature IDs: entity injection IDs or part-level feature IDs (box, extrusion, etc.).
- **Empty `from` array `[]` is rejected** with error 1001.
- **Empty source feature** (EI with no solids) returns `[]` with maxLevel=31 — no error, just empty result.
- **Consumption error message is misleading.** Says "Entity 'X' is not available" but the check is per-solid, not per-entity. With indices, only consumed indices are blocked.
- **No `updateUseSolid` or `deleteUseSolid` API.** To remove the reference, delete the destination EI or the individual solids with `solid.deleteSolid`.

## Common Errors

| Code | Level | Message | Cause |
|---|---|---|---|
| 1014 | ERROR | `Entity "X" is not available. It has already been consumed/used in another operation.` | Source solid(s) already consumed by a prior `useSolid` |
| 1014 | ERROR | `Entity of operation "X" is not available. Only entities of operations which have been created before the container can be used.` | Source feature created after destination EI (or self-reference) |
| 1001 | ERROR | `The parameter "in" has a wrong id type! Provide only following id types: ["entityinjection"]` | `in` is not an EI ID |
| 1001 | ERROR | `An element of parameter "from" has the wrong type!` | Mixed plain IDs and objects in `from` array |
| 1001 | ERROR | `The parameter "from" has the wrong type! It should be of type (Array<object>\|Array<id>)` | Empty `from` array |
| 1006 | ERROR | `An element of parameter "from" has an invalid id!` | Nonexistent feature ID |
| 0 | ERROR | `[Evaluation error ... objId not found]` | Invalid index (out of range for the feature's solid count) |
| 0 | ERROR | `[Evaluation error ... OBJ_ErrorMessage ...]` | Part ID or solid ID passed in `from` (internal crash) |

## Usage Hints

- **Use `useSolid` when you need to reference solids from part-level features (box, extrusion, revolve) inside an entity injection for direct manipulation** (booleans, transforms, etc.).
- **Use `indices` for selective consumption** — if a source has 3 solids and you only need solid 0, use `{ id: srcId, indices: [0] }` to keep solids 1 and 2 available for other EIs.
- **For independent copies, use `solid.copy` instead.** `useSolid` is parametric — source changes propagate. If you need a snapshot that doesn't update, copy the useSolid'd solid.
- **Returned IDs work immediately** for any `solid.*` operation — no recalc needed before using them.
- **Create the destination EI after all source features.** Feature tree ordering is enforced.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Demo' })).result

// Create source features
const boxFeat = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

// Create destination EI (must come AFTER source in feature tree)
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'WorkEI' })).result

// Pull the box solid into the EI
const solidIds = (await api.v1.solid.useSolid({ from: [boxFeat], in: eifId })).result
// solidIds → [98] (new ID, different from boxFeat)

// Use the solid for operations
await api.v1.solid.translation({ id: eifId, target: solidIds[0], translation: [100, 0, 0] })

// With indices (selective consumption):
const srcEif = /* entity injection with multiple solids */
const dstEif = /* destination EI */
const selected = (await api.v1.solid.useSolid({
  from: [{ id: srcEif, indices: [0, 2] }],  // only solids 0 and 2
  in: dstEif
})).result
```

## Related

- `solid.copy` — independent copy (NOT parametric — changes don't propagate)
- `solid.deleteSolid` — remove solids from an EI (including useSolid'd references)
- `part.entityInjection` — create the destination container
- `part.box`, `part.extrusion`, `part.revolve` — part-level features whose solids can be referenced via useSolid
