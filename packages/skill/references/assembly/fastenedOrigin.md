# assembly.fastenedOrigin

Locks one instance to the assembly origin (world [0,0,0]). Unlike `fastened` (two instances), it takes only `mate1`.

Prerequisites: assembly root, an instance whose template contains a `part.workCSys`.

## Key Parameters

- `id` — assembly root ID (required)
- `mate1.path` — `[instanceId]` (required)
- `mate1.csys` — workCSys ID from the template (required); this csys is placed on the assembly origin
- `mate1.flip` / `mate1.reorient` — as in `assembly/fastened`; applied before offsets
- `xOffset` / `yOffset` / `zOffset` — translation in the **world/assembly frame** (default 0)
- `xRotation` / `yRotation` / `zRotation` — rotation around the assembly origin. Radians or deg string (`'90deg'`), stored as radians
- `useCurrentTransform` — `1` freezes the current position: offsets are back-computed (exactly matching the instance's transformation coordinates), no movement
- `name` — default `"FastenedOrigin"`

## Alignment Semantics (CRITICAL)

With zero offsets/rotation, the instance moves so mate1's csys coincides with the assembly origin and axes. Offsets then translate in the assembly frame (a rotated csys rotates the part but does not remap offset directions); rotations rotate around the assembly origin.

| Template csys (40×30×20 plate) | Params | Instance placement |
|---|---|---|
| at part origin | — | `[0,0,0]` |
| `offset [40,0,20]` | — | `[-40,0,-20]` (csys point sits on the assembly origin) |
| `offset [40,0,20]` + `rotation [0,0,π/2]` | — | `[0,40,-20]`, rotated −90° about Z (csys axes align with assembly axes) |
| same rotated csys | `xOffset: 5` | `[5,40,-20]` — along assembly X |

Build the csys with `part.workCSys({ offset, rotation })`; `origin`/`xDirection`/`yDirection` are not `workCSys` parameters and are ignored (csys stays at the part origin). The built-in `Origin` from `getWorkGeometry` is a work point and is rejected as `csys` (`wrong id type ... ["workcsys"]`).

## Return Value

Constraint ID; array call → `Array<id>`.

## getFastenedOrigin

See `assembly/getFastenedOrigin`.

## updateFastenedOrigin

`updateFastenedOrigin({ id: constraintId, ... })` — takes the **constraint ID**. True partial update: unspecified params, including mate1 sub-params, are preserved.

- **Zeroing:** `xOffset: 0`, `zRotation: 0` reset those params.
- **Rename:** old name immediately unfindable via getFastenedOrigin.
- **useCurrentTransform:** back-computes offsets, same as at creation.
- **Empty update** `{ id }` is a no-op (COG and state unchanged).
- **mate1 sub-params update independently** — `mate1: { flip: '-Z' }` without path/csys keeps the other mate1 fields.
  - `flip` (all 6 values) / `reorient` (all 4 values) — instance repositions immediately.
  - `csys` — changes which point of the part sits on the origin.
  - `path` — retargets to another instance, which is repositioned; **the old instance keeps its last constrained position** (does not revert to its initial transformation).
- **Combined updates** (flip + reorient + offsets + rotations) apply in creation order: orientation → offsets → rotation.
- **Array form** returns the IDs:

```js
await api.v1.assembly.updateFastenedOrigin([
  { id: foA, xOffset: 10, yOffset: 50 },
  { id: foB, xOffset: 70, zRotation: '45deg' },
  { id: foC, mate1: { flip: '-Z' }, xOffset: 130 },
]) // → [foA, foB, foC]
```

## Gotchas

- **Duplicate constraints silently accepted.** Two fastenedOrigin constraints on the same instance both succeed, but the first wins — the second has no effect on positioning.
- getFastenedOrigin returns rotations in radians.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"id" must be provided to create CC_FastenedOriginConstraint` | 1004 | Missing assembly id |
| `"mate1" must be provided` | 1004 | Missing mate1 |
| `invalid id in csys` | 1006 | Bad csys ID |
| `Type "X" is not supported as flip type` | 1013 | Invalid flip string |
| `not an assembly id` | 1007 | Instance/template ID passed as `id` |
| `path has wrong id type` | 1001 | Template ID in path instead of instance ID |
| `constraint id does not exist` | 1006 | Bad ID in updateFastenedOrigin |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Mate' })).result  // csys at part origin
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Base' })).result

const foId = (await api.v1.assembly.fastenedOrigin({
  id: asmId, name: 'FO_Base',
  mate1: { path: [inst], csys: wcs },
  xOffset: 50, zRotation: '90deg',
})).result

await api.v1.assembly.updateFastenedOrigin({ id: foId, xOffset: 80, yOffset: 10 })
const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Base' })).result
```

## Related

`assembly.fastened` · `assembly.updateFastenedOrigin` · `assembly.getFastenedOrigin` · `assembly.instance` · `part.workCSys`
