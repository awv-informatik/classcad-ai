# assembly.instance

Creates instances of templates in the assembly tree. Instances are lightweight references — geometry comes from the linked template, not stored per-instance.

## Prerequisites

- An assembly root (`assembly.create`)
- At least one template (`assembly.partTemplate` or `assembly.assemblyTemplate`) with geometry

## Key Parameters

- `productId` — template to instantiate. Accepts numeric ID or string template name (e.g., `'Bracket'`).
- `ownerId` — where to place the instance. Must be assembly root ID, assembly template ID, or instance ID. **NOT** a part template ID. Accepts numeric ID or string name (e.g., `'AssemblyRoot'`).
- `transformation` — two formats supported:
  - **3-vector:** `[[originX,Y,Z], [xDirX,Y,Z], [yDirX,Y,Z]]` — zDir derived from cross product. Default: `[[0,0,0],[1,0,0],[0,1,0]]` (identity at origin).
  - **4x4 matrix:** `[[R00,R01,R02,Tx],[R10,R11,R12,Ty],[R20,R21,R22,Tz],[0,0,0,1]]` — row-major. **Scaling is silently ignored.** Only rotation + translation are used. Must be orthogonal. Left-handed matrices (det(R)=-1, e.g. mirrors) are **rejected** with error 1014.
- `name` — instance name. If omitted, auto-generated as `{templateName}` for the first instance, then `{templateName}0`, `{templateName}1`, etc. Duplicate names are allowed (no error).
- `ident` — opaque string metadata. Not visible in structure tree, not queryable via `getInstance`, not stored in user data. Likely only appears in STEP export.
- `isLocal` — `FALSE` (default): transform is in world/global coordinates. `TRUE`: transform is relative to the owner's coordinate frame. **Critical for sub-assembly placement** — use `isLocal: TRUE` when positioning instances relative to a sub-assembly that is itself offset/rotated.

## Return Value

- Single call: `id` — the created instance ID (a CC_ProductReference node).
- Array call: `Array<id>` — one ID per input spec, in order.

## Gotchas

- **ownerId type restriction**: only assembly root, assembly template, or instance IDs accepted. Passing a part template ID gives error 1001.
- **Instance-as-owner propagation**: when `ownerId` is an instance, the child is added to the instance's **underlying template** — all other instances of that template also get the child. This is by design but surprising if you only wanted to add to one instance.
- **isLocal default is global**: when adding to a sub-assembly instance with `isLocal: FALSE` (default), the transform is in world coordinates, NOT relative to the sub-assembly. If you want local-to-sub-assembly positioning, you must explicitly set `isLocal: TRUE`.
- **Scaling silently ignored**: a 2x scale matrix is accepted without error but produces no scaling. Volume and COG are identical to an identity-rotation instance.
- **Left-handed rejected**: mirror matrices fail with error 1014 (unlike `common.transformObjectWithMatrix` which auto-corrects).
- **Auto-name counter**: first instance gets template name verbatim (`"Plate"`), second gets `"Plate0"` — counter starts at 0, not 1.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"productId" must be provided` | 1004 | Missing productId |
| `"ownerId" must be provided` | 1004 | Missing ownerId |
| `"ownerId" has a wrong id type` | 1001 | Part template ID used as owner — needs assembly/instance type |
| `ToId() didn't get an existing or valid id` | 0 (warn) | Invalid numeric productId (e.g., 999999) |
| `The provided matrix is left-handed` | 1014 | Mirror/reflection matrix (det(R)=-1) |

## Spatial Verification

Instance world-space COG follows: `world_COG = R × template_local_COG + translation_origin`, where R is the rotation matrix from the transform. Use `calculateMassProperties({ id: rootAssemblyId })` for combined verification without materializing instances.

**Do NOT use `calculateMassProperties({ id: instanceId })` for routine verification** — it materializes all instances of the same template, breaking template propagation (see `assembly/generic.md`).

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

// 3-vector format: offset X=80
const inst1 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Left',
  transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// 4x4 matrix: 90° Z rotation at [0, 80, 0]
const inst2 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'Rotated',
  transformation: [[0, -1, 0, 0], [1, 0, 0, 80], [0, 0, 1, 0], [0, 0, 0, 1]],
})).result

// Batch creation
const [a, b, c] = (await api.v1.assembly.instance([
  { productId: tplId, ownerId: asmId, name: 'A' },
  { productId: tplId, ownerId: asmId, name: 'B',
    transformation: [[40, 0, 0], [1, 0, 0], [0, 1, 0]] },
  { productId: 'Bracket', ownerId: asmId, name: 'C',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]] },
])).result
```

## Related

- `assembly.getInstance` — query instances by owner/name
- `assembly.deleteInstance` — remove instances
- `assembly.setCurrentProduct` — switch context to assembly root after template work
- `assembly.partTemplate` / `assembly.assemblyTemplate` — create templates to instance
- `assembly.calculateMassProperties` — spatial verification (use root ID, not instance ID)
