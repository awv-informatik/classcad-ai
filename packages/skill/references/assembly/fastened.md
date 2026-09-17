# assembly.fastened

Rigid constraint between two instances: locks relative position and orientation. The primary constraint for fixing parts together.

Prerequisites: assembly root (`assembly.create`), two instances whose templates contain a `part.workCSys`.

## Key Parameters

- `id` — assembly root ID (required)
- `mate1` / `mate2` — `{ path: [instanceId], csys: workCSysId, flip?, reorient? }`
- `xOffset` / `yOffset` / `zOffset` — translation of mate2's csys from mate1's csys, along **mate1's csys axes**
- `xRotation` / `yRotation` / `zRotation` — rotation of inst2 around mate1's csys axes. Radians or `'Ndeg'` string (stored as radians)
- `useCurrentTransform` — `1` locks the current relative transform; equivalent offsets are back-computed, nothing moves. Use it to freeze instances already positioned correctly
- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`; rotates inst2 to redefine the main axis
- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`; CW rotation around the main axis in 90° steps

## Alignment Semantics (CRITICAL)

**The csys pair is the mounting definition.** inst2 moves so mate2's csys coincides with mate1's csys (origin on origin, axes on axes); offsets and rotations are then applied in mate1's csys frame.

| Template csys (both instances of a 40×30×20 plate, inst1 at origin) | Params | inst2 placement |
|---|---|---|
| mate1 at origin, mate2 at origin | — | `[0,0,0]` |
| mate1 `offset [40,0,20]`, mate2 at origin | — | `[40,0,20]` |
| mate1 `offset [40,0,20]`, mate2 `offset [10,0,0]` | — | `[30,0,20]` (mate2's csys lands on mate1's) |
| mate1 `offset [40,0,20]` + `rotation [0,0,π/2]`, mate2 at origin | — | `[40,0,20]`, rotated 90° about Z |
| same rotated mate1 | `xOffset: 50` | `[40,50,20]` — along mate1's csys X (world Y) |

Put a csys where the parts meet (expression-driven if it should follow parameters, e.g. `offset: '[0,0,@expr.H]'`) and use offsets for the remaining distance.

Build each csys with `part.workCSys({ offset, rotation })` (or `type: 'XYAXISORIGIN'` with references). `origin`/`xDirection`/`yDirection` are not `workCSys` parameters and are ignored, leaving the csys at the part origin. The built-in `Origin` from `getWorkGeometry` is a work point and is rejected as `csys` (`wrong id type ... ["workcsys"]`).

## Flip and Reorient

`flip` rotates inst2 before offsets are applied; `reorient` then adds a rotation around the main axis.

| flip | Effect | Rotation |
|---|---|---|
| `'Z'` (default) | Identity | None |
| `'-Z'` | Upside down | 180° around X |
| `'X'` | X becomes main axis | 90° around Y |
| `'-X'` | X down | -90° around Y |
| `'Y'` | Y becomes main axis | -90° around X |
| `'-Y'` | Y down | 90° around X |

| reorient | Rotation |
|---|---|
| `'0'` (default) | None |
| `'90'` | -90° CW around main axis |
| `'180'` | 180° around main axis |
| `'270'` | -270° CW (= 90° CCW) around main axis |

## Return Value

Constraint ID; array call → `Array<id>`.

## getFastened

See `assembly/getFastened`. Query by name; takes the assembly, not a part instance.

## updateFastened

`updateFastened({ id: constraintId, ... })` — true partial update: only passed params change (`xOffset: 100` keeps the other offsets, rotations, flip, reorient).

- **Zeroing works:** `zRotation: 0` / `xOffset: 0` removes it; the instance moves back.
- **Rename:** `name: 'New'` — old name immediately unfindable via `getFastened`.
- **Mate path swap:** `mate2: { path: [newInst], csys: wcs }` retargets; the new instance is repositioned immediately, the old one stays at its current position (no snap-back).
- **Csys swap:** changing `mate1.csys`/`mate2.csys` re-mounts inst2 immediately (origin csys → csys at `[40,0,20]` moves inst2 from `[0,0,0]` to `[40,0,20]`).
- **Flip/reorient:** must include `path` and `csys` in the mate object; same spatial effect as at creation.
- **useCurrentTransform:** back-computes offsets from the current relative position, no movement (offsets unchanged if already at the constraint position).
- **Empty update** `{ id }` is a valid no-op (returns the ID, maxLevel=31).
- **Array form:** `updateFastened([{ id: f1, xOffset: 80 }, { id: f2, zRotation: '90deg' }])` → `[f1, f2]`.

Failed updates do NOT corrupt the constraint; all params stay unchanged.

| Error | Code | Cause |
|---|---|---|
| `"constraint id does not exist"` | 1006 | Invalid/nonexistent ID |
| `"not a constraint or relation"` | 1007 | Assembly root or instance ID passed as constraint |
| `"invalid id" in csys` | 1006 | Bad csys ID |
| `"not supported as flip type"` | 1013 | Invalid flip string |

## Gotchas

- **Geometry changes do not re-solve on `common.recalc()`.** When a csys moves because its part changed (e.g. `offset: '[0,0,@expr.H]'` after an expression update), `recalc()` regenerates the part but leaves inst2 where it was. The assembly solve runs at the end of `part.updateExpression` on a part that is instanced in the assembly, and on `updateFastened`. See `recipes/assembly-parameters`.
- **Duplicate names allowed** silently; `getFastened` returns the first match.
- **Self-fastened rejected cleanly:** same instance in both mates → error 1014, does NOT hang.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"id" must be provided` | 1004 | Missing assembly id |
| `"mate1" must be provided` / `"mate2" must be provided` | 1004 | Missing mate |
| `paths belong to same rigid set` | 1014 | Same instance in both mates |
| `invalid id` | 1006 | Bad csys ID |
| `not supported as flip type` | 1013 | Invalid flip string |
| `couldn't find constraint with name X` | 0 | getFastened with non-existent name |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Mate' })).result  // csys at part origin
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'B' })).result

// inst2 100mm along X from inst1, rotated 90° about Z
const fId = (await api.v1.assembly.fastened({
  id: asmId, name: 'Joint',
  mate1: { path: [inst1], csys: wcs },
  mate2: { path: [inst2], csys: wcs },
  xOffset: 100, zRotation: '90deg',
})).result

await api.v1.assembly.updateFastened({ id: fId, xOffset: 80, zOffset: 10 })
const state = (await api.v1.assembly.getFastened({ id: asmId, name: 'Joint' })).result
```

## Related

`assembly.fastenedOrigin` · `assembly.updateFastened` · `assembly.getFastened` · `assembly.instance` · `part.workCSys`
