# assembly.fastenedOrigin

Locks an instance at a position/orientation relative to the assembly's global origin. Unlike `fastened` (which constrains two instances to each other), `fastenedOrigin` has only one mate and positions relative to the global coordinate system. Typical use: anchor one "base" instance at the origin, then constrain other instances to it with `fastened`.

## Prerequisites

- A root assembly (`assembly.create`)
- At least one instance with a work coordinate system in its template
- Must be in assembly context (`setCurrentProduct({ id: asmId })`)

## Key Parameters

- `id` (required) — assembly ID where the constraint is created
- `mate1` (required) — single mate object:
  - `path` (required) — array with instance ID(s). For top-level: `[instId]`. For sub-assembly children: `[etChildId]` (single ET child, NOT multi-element)
  - `csys` (required) — work coordinate system ID from the instance's template. Must be reachable from the instance in `path`
  - `flip` (optional, default `'Z'`) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'`. Defines which WCS axis aligns with the global main axis
  - `reorient` (optional, default `'0'`) — `'0'` | `'90'` | `'180'` | `'270'`. Rotation around the main axis in 90° steps. **Values are strings**
- `xOffset` / `yOffset` / `zOffset` (optional, default 0) — translation of the instance. Applied AFTER rotation
- `xRotation` / `yRotation` / `zRotation` (optional, default 0) — rotation around global axes. Accepts `real` (radians) OR `string` with degree suffix (e.g., `'45deg'`, `'90deg'`)
- `name` (optional, default `'FastenedOrigin'`) — constraint name. Duplicates allowed
- `useCurrentTransform` (optional, default FALSE) — pass `1` for TRUE. Ignores offset/rotation params and reverse-computes them from the instance's current transformation. Useful for "lock where it is" workflows

## Transformation Model

The constraint positions the instance in this order:

1. **Place** instance origin at the global origin (WCS orientation defines axis alignment via flip/reorient)
2. **Rotate** instance around the global origin by xRotation/yRotation/zRotation
3. **Translate** instance by xOffset/yOffset/zOffset

**WCS position within the template is irrelevant for positioning.** Only the WCS orientation (xDirection, yDirection) matters — it determines how the instance is rotated to align axes. The offsets directly set the instance's origin position in global space. Verified: two templates with WCS at [0,0,0] and [15,10,7.5] produce identical instance positions with the same offsets.

This differs fundamentally from `fastened`, where WCS positions define alignment points between two instances.

## Return Value

- **Single call:** numeric constraint ID
- **Batch call (array param):** array of constraint IDs
- **On error:** `null` (VOID), maxLevel 51
- **On success:** maxLevel 31 (info level)

## Batch Creation

Pass array of param objects: `fastenedOrigin([{...}, {...}])`. Returns array of IDs.

## Mate Path Semantics

Same rules as `fastened`:
- **Top-level instances:** `path: [instanceId]`
- **Sub-assembly children (expanded tree):** `path: [etChildId]` — single ET child ID. Get via `getInstance({ ownerId: subAsmInstanceId })`
- **Do NOT use multi-element paths** like `[parentInst, childInst]` — errors: "Mate path is not correct"
- **Do NOT pass template IDs** — errors: "path has a wrong id type! ['instance']"
- **The `csys` must be reachable from the path.** For sub-assembly instances, you can't use a WCS from a child part template with the parent's instance in path — use the ET child path instead

## Gotchas

- **Multiple fastenedOrigin on same instance allowed.** Unlike `fastened` (which blocks self-referencing), you can create multiple fastenedOrigin constraints referencing the same instance. Both succeed independently.
- **Constraint overrides instance transformation.** The solver repositions the instance. The `transformation` param from `instance()` is ignored.
- **Duplicate names allowed.** No uniqueness enforcement. `getFastenedOrigin` returns the first match.
- **`useCurrentTransform` pass `1`, not `true`.** The param type is `real`, not `boolean`.
- **Degree strings are stored as radians.** `getFastenedOrigin` returns rotation values in radians even if created with `'45deg'`.
- **`getFastenedOrigin` requires assembly ID.** Passing an instance ID returns null with maxLevel 51. Passing a nonexistent name also returns null with maxLevel 51.
- **Reorient values are strings**, not numbers. Pass `'90'`, not `90`.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"mate1" must be provided` | Missing required mate1 param | 1004 |
| `"id" must be provided to create CC_FastenedOriginConstraint` | Missing assembly ID | 1004 |
| `"path" must be provided` | Missing path in mate1 | 1004 |
| `"csys" must be provided` | Missing csys in mate1 | 1004 |
| `"path" has a wrong id type! ["instance"]` | Template ID or non-instance ID in path | 1001 |
| `ToId()/TOID() didn't get an existing or valid id.` | Nonexistent ID in path or csys | 1006 |
| `csys does not exist on the given mate path` | WCS not reachable from the instance in path | 1014 |
| `Mate path is not correct. The last element is not a direct child` | Multi-element path with wrong structure | 1014 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'MyAsm' })).result

const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
const wcs = (await api.v1.part.workCSys({
  id: tpl, name: 'WCS', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst = (await api.v1.assembly.instance({
  productId: tpl, ownerId: asmId, name: 'Base',
})).result

// Lock at origin with 45° Z rotation
const foId = (await api.v1.assembly.fastenedOrigin({
  id: asmId,
  name: 'FO_Base',
  mate1: { path: [inst], csys: wcs },
  zRotation: '45deg',
  xOffset: 50,
})).result
```

## useCurrentTransform Example

```js
// Place instance at specific position via transformation
const inst = (await api.v1.assembly.instance({
  productId: tpl, ownerId: asmId, name: 'Positioned',
  transformation: [[80, 40, 25], [1, 0, 0], [0, 1, 0]],
})).result

// Lock at current position — offsets auto-computed
const foId = (await api.v1.assembly.fastenedOrigin({
  id: asmId,
  name: 'FO_Lock',
  mate1: { path: [inst], csys: wcs },
  useCurrentTransform: 1,
})).result
// getFastenedOrigin will show xOffset=80, yOffset=40, zOffset=25
```

## Related

- `assembly.updateFastenedOrigin` — modify constraint params after creation
- `assembly.getFastenedOrigin` — retrieve constraint by name (returns first match)
- `assembly.fastened` — constrain two instances to each other (two mates)
- `assembly.instance` — create instances to constrain
- `part.workCSys` — create WCS that mates reference
