# part.entityInjection

Creates an entity injection (EI/EIF) feature inside a part — the **required container** for direct geometry. Every `solid.*` and `curve.shape()` call takes an EI ID as `id`.

## Key Parameters

- `id` (required) — part ID (not an assembly, not a sketch).
- `name` (optional) — default `"EntityInjection"`. Duplicates get auto-suffixed: `"Foo"`, `"Foo0"`, `"Foo1"`, … (the first keeps the exact name).

## Return Value

The EI feature ID (numeric) — pass as `id` to `solid.box`/`cylinder`/`sphere`/`cone`/etc., `curve.shape`, `solid.deleteSolid`, `solid.copy`.

## Gotchas

- **The EIF is a feature in the OPERATION SEQUENCE — it may only consume objects from EARLIER features.** Solid ops inside the EIF that reference curves of a sketch created AFTER the EIF run the sequence backwards: the model can appear correct in the session but is wrong in the tree (Buerligons replays the sequence with the EIF before the sketch). If sketch geometry is genuinely needed (e.g. 2D constraints), create the sketch BEFORE `part.entityInjection`. Idiomatic direct modeling needs no sketch at all: fill `curve.shape`s inside the EIF.
- **Solid/curve APIs reject part IDs** — `solid.box` with a part ID → error 1001 `The parameter "id" has a wrong id type! Provide only following id types: ["entityinjection"]`.
- **Retrieval by name via `part.getFeature`** works once the EIF contains a solid (`getFeature({ id, name: 'Geometry' })`); on an empty EIF it fails with "does not contain any entities".
- **No `updateEntityInjection` API.** Rename with `common.setObjectName`; delete with `part.deleteFeature({ ids: [eifId] })` (cascades — all contained solids/curves are deleted). `deleteFeature({ id: eifId })` fails with error 1004 — it takes `ids` (array).
- **`openFeature` / `closeFeature`** accept EI IDs without error (VOID, maxLevel=31).
- **`bodies` member is misleading** — an array member that stays empty (`members.bodies.members: []`, no `value`). Contained solids are the node's `children` (the `CC_Solid` ids `solid.*` returns); don't enumerate via `bodies`.
- **Two IDs per solid:** the `CC_Solid` id (in `EI.children`, returned by `solid.*` creation) and the graphic container id (in the part node's `solids`, renumbered on re-tessellation, accepted only by `requestVisualisation`). Use the `CC_Solid` id.

## Structure Tree

Creates two nodes:
1. **`CC_EntityInjection`** (the returned ID) under `CC_EntitySet`. Members: `bodies` (always empty), `solidOperation` (0), `_VERSION`.
2. **`CC_OperationReference`** (returned ID + 2) under `CC_OperationSequence`, named `<eiName>Ref` (e.g. "EntityInjectionRef", "MyEIRef").

## Common Errors

| Code | Level | Message | Cause |
|------|-------|---------|-------|
| 1004 | ERROR | `"id" must be provided to create CC_EntityInjection` | Missing `id` param |
| 1006 | ERROR | `The provided part id does not exist.` | Invalid part ID |
| 1001 | ERROR | `The parameter "id" has a wrong id type!` | Passing EI ID where part ID expected (or vice versa) |

## Cross-EI Operations

- `solid.subtraction({ id: ei1, target: solidInEi1, tools: [solidInEi2] })` — `id` is the owning EI; `target`/`tools` can reference solids from any EI.
- `solid.copy({ id: destEI, target: solidFromOtherEI })` — copies into `destEI`, source unchanged.
- Solids and shapes can coexist in the same EI.

Full ID type mapping: `references/part/id-hierarchy.md`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Geometry' })).result

const boxId = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result
const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result
```

## Related

`solid.box` · `curve.shape` · `solid.deleteSolid` · `part.deleteFeature` · `common.setObjectName` · `references/part/id-hierarchy.md`
