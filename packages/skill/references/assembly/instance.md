# assembly.instance

Creates instances of templates in the assembly tree. Instances are lightweight references — geometry comes from the linked template.

Prerequisites: assembly root, a template (`partTemplate` / `assemblyTemplate`) with geometry.

## Key Parameters

- `productId` — template to instantiate: numeric ID or template name string (`'Bracket'`)
- `ownerId` — assembly root, assembly template, or instance ID (numeric or name, e.g. `'AssemblyRoot'`). **NOT a part template** (error 1001). With an instance as owner, the child is added to the instance's **underlying template** — all other instances of that template get it too
- `transformation` — two formats:
  - **3-vector** `[[originX,Y,Z], [xDirX,Y,Z], [yDirX,Y,Z]]`, zDir from the cross product. Default `[[0,0,0],[1,0,0],[0,1,0]]`
  - **4x4** row-major `[[R00,R01,R02,Tx],[R10,R11,R12,Ty],[R20,R21,R22,Tz],[0,0,0,1]]`. Must be orthogonal. **Scaling is silently ignored** (a 2x scale matrix gives the same volume and COG as identity rotation). Left-handed matrices (det(R)=-1, mirrors) are **rejected** with 1014 (unlike `common.transformObjectWithMatrix`, which auto-corrects)
- `name` — omitted → template name verbatim for the first instance (`"Plate"`), then `"Plate0"`, `"Plate1"`… (counter starts at 0). Duplicate names allowed
- `ident` — string alias stored in the assembly's `IdentToIdMap`; usable in place of the id in APIs that resolve strings (e.g. `transformInstance({ id: 'myIdent' })`), not queryable via `getInstance`. See `assembly/setIdent`
- `isLocal` — `FALSE` (default): transform in world coordinates, even when the owner is an offset/rotated sub-assembly instance. `TRUE`: relative to the owner's frame — set it explicitly for local-to-sub-assembly placement

## Return Value

Instance ID (CC_ProductReference); array call → `Array<id>` in input order.

## Spatial Verification

`world_COG = R × template_local_COG + translation_origin`. Verify with `calculateMassProperties({ id: rootAssemblyId })`. **Do NOT use `calculateMassProperties({ id: instanceId })` for routine checks** — it materializes all instances of that template, breaking template propagation (see `assembly/generic`).

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"productId" must be provided` / `"ownerId" must be provided` | 1004 | Missing param |
| `"ownerId" has a wrong id type` | 1001 | Part template ID as owner |
| `ToId() didn't get an existing or valid id` | 0 (warn) | Invalid numeric productId (e.g. 999999) |
| `The provided matrix is left-handed` | 1014 | Mirror/reflection matrix |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

// 3-vector: offset X=80
const inst1 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Left',
  transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// 4x4: 90° Z rotation at [0, 80, 0]
const inst2 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Rotated',
  transformation: [[0, -1, 0, 0], [1, 0, 0, 80], [0, 0, 1, 0], [0, 0, 0, 1]],
})).result

// Batch
const [a, b] = (await api.v1.assembly.instance([
  { productId: tplId, ownerId: asmId, name: 'A' },
  { productId: tplId, ownerId: asmId, name: 'B', transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]] },
])).result
```

## Related

`assembly.getInstance` · `assembly.deleteInstance` · `assembly.setCurrentProduct` · `assembly.partTemplate` / `assembly.assemblyTemplate` · `assembly.calculateMassProperties`
