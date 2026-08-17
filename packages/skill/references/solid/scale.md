# solid.scale

Scales a solid by a uniform factor relative to the **part coordinate system origin**. The solid is modified in place — no new solid is created. Both size and position are affected: an offset body moves further from (or closer to) the origin.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- A solid in that EIF

## Key Parameters

- `id` — entity injection feature ID (not part ID). Error code 1001 if you pass a part ID.
- `target` — solid ID to scale. Must be a valid, non-consumed solid. Error code 1001 if wrong type, 1006 if invalid/consumed.
- `factor` — scale factor (real number). Required — code 1004 if omitted.

All three parameters are required.

## Return Value

Returns the **target solid ID** (same ID, not a new one). maxLevel=31 on success, messages=[].

## Behavior

- **Uniform scaling.** All three axes scale by the same factor. There is no per-axis scale — use `common.transformObjectWithMatrix` for non-uniform scaling if available.
- **Scale center is the origin.** Scaling happens relative to the part coordinate system origin `[0,0,0]`. A body at `[100,0,0]` scaled by 2x ends up at `[200,0,0]` (position doubles too). A body centered at origin stays in place.
- **Cumulative.** Each `scale` call multiplies. Two calls of factor=2 then factor=3 equal a single factor=6. There is no absolute "set scale" — only relative multiplication.
- **Factor=1 is a no-op.** Succeeds silently — returns solid ID, maxLevel=31.
- **Factor=0 is a silent no-op.** Returns success (maxLevel=31) but the body is **unchanged** — bounding box, vertices, normals all stay the same. Subsequent operations work normally. This is special-cased; do not rely on it.
- **Very small non-zero factors (e.g., 0.0001) actually scale** and produce degenerate geometry with undefined bounding box. Avoid.
- **Negative factors work** but **flip face normals** — the solid becomes "inside-out." A centered body scaled by -1 has identical bounding box but inverted normals. Double -1 restores the original. Use `solid.mirror` instead for proper mirroring.
- **No upper/lower bound on factor.** Factor=100 and factor=0.001 both succeed. Fractional factors (0.5, 1.5, 2.5, 0.333) all work.
- **Works on all solid types.** Box, sphere, cylinder, cone, extrusion, revolve, compound (post-boolean) — all scale normally.
- **No `updateScale` method exists.** To undo, apply the inverse factor (1/factor). To scale by a specific total, compute the ratio from current to desired.

## Gotchas

- **`id` is the EIF ID, not the part ID.** Same as all `solid.*` transforms.
- **Scale center is origin, not body center.** Offset bodies move when scaled. To scale around a body's own center: translate body to origin → scale → translate back. This is the same pattern as `solid.rotation`.
- **Consumed tool solids are invalid.** After a boolean with `keepTools: false` (default), the tool solid ID is dead.
- **Auto-scaling hides single-body scaling in snapshots.** If verifying visually, include a fixed reference body.
- **Negative factor produces inside-out geometry.** Normals flip direction (e.g., [0,0,-1] → [0,0,1]). This can cause rendering artifacts and may break boolean operations. Use `solid.mirror` instead.
- **factor=0 does nothing** — it's a no-op, not a "collapse to point." Don't use it expecting to destroy geometry.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` | 1001 | Passed part ID instead of EIF ID | Use the entity injection feature ID |
| `"The parameter \"target\" has a wrong id type!"` | 1001 | Passed non-solid ID as target | Use a solid ID |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Invalid or consumed solid ID | Check the solid wasn't consumed by a boolean |
| `"The parameter \"factor\" must be provided!"` | 1004 | Missing factor param | Always provide a real number |
| `"The parameter \"target\" must be provided!"` | 1004 | Missing target param | Always provide the solid ID |
| `"The parameter \"id\" must be provided!"` | 1004 | Missing id param | Always provide the EIF ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result

// Scale 2x — box doubles in all dimensions
const r = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 2 })
// r.result === boxId (same ID returned)
// r.maxLevel === 31

// To scale around body center (not origin):
const box2 = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [100, 0, 0] })).result
await api.v1.solid.translation({ id: eifId, target: box2, translation: [-100, 0, 0] }) // move to origin
await api.v1.solid.scale({ id: eifId, target: box2, factor: 2 }) // scale at origin
await api.v1.solid.translation({ id: eifId, target: box2, translation: [100, 0, 0] }) // move back
```

## Related

- `solid.translation` — translate a solid by a vector
- `solid.rotation` — rotate a solid by Euler angles (also orbits origin)
- `solid.mirror` — mirror a solid across a plane (proper mirroring, unlike negative scale)
- `solid.copy` — copy a solid (supports translation + rotation at creation)
