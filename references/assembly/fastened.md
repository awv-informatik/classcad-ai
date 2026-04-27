# assembly.fastened

Creates a rigid constraint between two instances, locking their relative position and orientation via their work coordinate systems. The constraint solver repositions mate2's instance to satisfy the constraint — any initial `transformation` set on the instance is overridden.

## Prerequisites

- A root assembly (`assembly.create`)
- At least two instances with work coordinate systems in their templates
- Must be in assembly context (`setCurrentProduct({ id: asmId })`)

## Key Parameters

- `id` (required) — assembly ID where the constraint is created
- `mate1` / `mate2` (both required) — each has:
  - `path` (required) — array with instance ID(s). For top-level instances: `[instId]`. For sub-assembly children: use the expanded tree child ID directly `[etChildId]` — do NOT use `[parentInst, childInst]`
  - `csys` (required) — work coordinate system ID from the instance's template
  - `flip` (optional) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'` (default `'Z'`). Defines the main axis alignment of the mate
  - `reorient` (optional) — `'0'` | `'90'` | `'180'` | `'270'` (default `'0'`). Rotation around the main axis in 90° steps. Values are strings
- `xOffset` / `yOffset` / `zOffset` (optional, default 0) — positional offset from mate1 to mate2
- `xRotation` / `yRotation` / `zRotation` (optional, default 0) — rotation of mate2 around mate1's axes. Accepts `real` (radians) OR `string` with degree suffix (e.g., `'45deg'`, `'90deg'`)
- `name` (optional, default `'Fastened'`) — constraint name. Duplicates allowed
- `useCurrentTransform` (optional, default FALSE) — when TRUE, ignores offset/rotation params and reverse-computes them from the instances' current positions. Useful for "lock where they are" workflows

## Return Value

- **Single call:** numeric constraint ID
- **Batch call (array param):** array of constraint IDs
- **On error:** `null` (VOID), maxLevel 51
- **On success:** maxLevel 31 (info level)

## Batch Creation

Pass array of param objects: `fastened([{...}, {...}])`. Returns array of IDs.

## Mate Path Semantics

- **Top-level instances:** `path: [instanceId]` — single-element array
- **Sub-assembly children (expanded tree):** `path: [etChildId]` — use the CC_ProductReferenceET ID directly as a single element. Get these IDs via `getInstance({ ownerId: subAsmInstanceId })`
- **Do NOT use multi-element paths like `[parentInst, etChild]`** — this errors: "Mate path must contain either a single instance from expanded tree or one or more instances from templates."
- **Do NOT pass template IDs in path** — error: "path has a wrong id type! Provide only following id types: ['instance']"

## Gotchas

- **Constraint overrides instance transformation.** The constraint solver repositions the instance. The `transformation` param from `instance()` is ignored once a constraint is applied.
- **Self-constraint blocked.** Same instance in both mates errors: "mate1 and mate2 cannot be used in this combination... they probably belong to the same rigid set."
- **Duplicate names allowed.** No uniqueness enforcement. `getFastened` returns the first match.
- **WCS must belong to the template.** The `csys` ID must be a work coordinate system from the instance's template — not from a different template or the assembly itself.
- **`fastenedOrigin` and `fastened` can coexist** on the same assembly, even referencing the same instance.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"mate2" must be provided` | Missing required mate2 param | 1004 |
| `"id" must be provided to create CC_FastenedConstraint` | Missing assembly ID | 1004 |
| `"path" has a wrong id type! ["instance"]` | Template ID or non-instance ID in path | 1001 |
| `"path" has an invalid id!` | Nonexistent ID in path | 1006 |
| `"csys" has an invalid id!` | Nonexistent WCS ID | 1006 |
| `mate1 and mate2... same rigid set` | Same instance in both mates | 1014 |
| `Mate path must contain either a single instance from expanded tree or one or more instances from templates` | Multi-element path mixing ET and non-ET | 1014 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'MyAsm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tpl1, name: 'Box', length: 60, width: 40, height: 20 })
const wcs1 = (await api.v1.part.workCSys({
  id: tpl1, name: 'WCS', origin: [30, 20, 20],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tpl2, name: 'Box', length: 20, width: 20, height: 30 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'WCS', origin: [10, 10, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({
  productId: tpl1, ownerId: asmId, name: 'Base',
})).result
const inst2 = (await api.v1.assembly.instance({
  productId: tpl2, ownerId: asmId, name: 'Block',
})).result

// Constrain: position block offset from base, rotated 45° around Z
const cId = (await api.v1.assembly.fastened({
  id: asmId,
  name: 'F1',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
  xOffset: 25,
  zOffset: 10,
  zRotation: '45deg',
})).result
```

## Related

- `assembly.updateFastened` — modify constraint params after creation
- `assembly.getFastened` — retrieve constraint by name (returns first match)
- `assembly.fastenedOrigin` — lock instance at assembly origin (single mate)
- `assembly.instance` — create instances to constrain
- `part.workCSys` — create WCS that mates reference
