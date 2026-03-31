# part.entityInjection

Creates an entity injection feature inside a part. This is the **required container** for all direct geometry — every `solid.*` and `curve.shape()` call needs an entity injection ID as its `id` parameter.

## Prerequisites

- A part (`part.create`)

## Key Parameters

- `id` (required) — ID of the part to create the entity injection in. Must be a part ID (not an assembly, not a sketch).
- `name` (optional) — display name for the feature. Default: `"EntityInjection"`. Duplicate names get auto-suffixed: `"Foo"`, `"Foo0"`, `"Foo1"`, etc. The first keeps the exact name.

## Return Value

Returns the entity injection feature ID (numeric). This is the ID you pass to:
- `solid.box`, `solid.cylinder`, `solid.sphere`, `solid.cone`, `solid.torus`, etc. as `id`
- `curve.shape` as `id`
- `solid.deleteSolid` as `id`
- `solid.copySolid` as `id`

## Gotchas

- **Solid/curve APIs reject part IDs.** If you pass a part ID to `solid.box`, you get error 1001: `The parameter "id" has a wrong id type! Provide only following id types: ["entityinjection"]`. You must create an entity injection first.
- **No retrieval by name.** There is no `getEntityInjection` API. `getWorkGeometry` and `getSketch` do not find entity injections. You must store the ID at creation time.
- **No `updateEntityInjection` API.** Use `common.setObjectName` to rename. Use `part.deleteFeature({ ids: [eifId] })` to delete (cascades — all contained solids/curves are also deleted).
- **`deleteFeature` takes `ids` (array), not `id`.** Common mistake: `deleteFeature({ id: eifId })` fails with error 1004. Correct: `deleteFeature({ ids: [eifId] })`.
- **`bodies` member is misleading.** In the structure tree, the EI node has a `members.bodies` array that is always empty. Actual contained solids appear in the `children` array. Do not check `bodies` to enumerate solids.
- **Two IDs per solid.** Each solid created in an EI has two IDs: a feature-level ID (in `EI.children`) and a geometry-level ID (in `part.solids`). The `solid.*` creation calls return the feature-level ID.

## Structure Tree

Creating an entity injection produces two nodes:
1. **`CC_EntityInjection`** (the returned ID) — lives under `CC_EntitySet`. Has members: `bodies` (always empty array), `solidOperation` (0), `_VERSION`.
2. **`CC_OperationReference`** (at returned ID + 2) — lives under `CC_OperationSequence`. Named `<eiName>Ref` (e.g., "EntityInjectionRef", "MyEIRef").

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1004 | ERROR | `"id" must be provided to create CC_EntityInjection` | Missing `id` param |
| 1006 | ERROR | `The provided part id does not exist.` | Invalid part ID |
| 1001 | ERROR | `The parameter "id" has a wrong id type!` | Passing EI ID where part ID expected (or vice versa) |

## Feature Operations

- `openFeature({ id: eifId })` / `closeFeature({ id: eifId })` — both accept EI IDs without error (VOID return, maxLevel=31).
- `setObjectName({ id: eifId, name: '...' })` — works for renaming.
- `deleteFeature({ ids: [eifId] })` — deletes EI and all contents (cascade).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Geometry' })).result

// Now use eifId for all solid/curve creation
const boxId = (await api.v1.solid.box({
  id: eifId, length: 100, width: 60, height: 40
})).result

const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
```

## Related

- `solid.box`, `solid.cylinder`, etc. — consume the EI ID
- `curve.shape` — creates curve container inside the EI
- `solid.deleteSolid` — delete individual solids from within an EI
- `part.deleteFeature` — delete the entire EI (cascades)
- `common.setObjectName` — rename the EI after creation
