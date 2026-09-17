# solid.slice

Cuts a solid at a plane, modifying the target **in place**.

## Key Parameters

- `id` — entity injection feature ID
- `target` — solid to slice (any type: primitive, extrusion, revolve, boolean result)
- `originPos` — `[x, y, z]` point on the plane. Primitives without `translation` are origin-centered (a `height: 40` box spans z=-20..20, NOT 0..40) — plan accordingly.
- `normal` — `[x, y, z]` plane normal; magnitude irrelevant (`[0,0,100]` = `[0,0,1]`). **The side the normal points toward is REMOVED.**
- `keepBoth` — **default `true`**: keeps both halves — the target becomes one half and the call returns the id of the new solid holding the other (80×60×40 box sliced at z=0: two solids, total volume 192000). `false`: keeps only the negative side, returns `null` (VOID); the target ID stays valid.

## Doc Discrepancy: Normal Direction

The docs say "Part on the **negative** side of normal vector is removed." Wrong: **the POSITIVE side (where the normal points) is removed; the NEGATIVE side is kept.** The normal points toward the material to discard.

- `normal: [0,0,1]` at z=0 → keeps z < 0, removes z > 0
- `normal: [0,0,-1]` at z=0 → keeps z > 0, removes z < 0

## Edge Cases

| Case | Result |
|---|---|
| Plane doesn't touch the solid | No-op — no error, no messages, no change, even if the whole solid is on the "remove" side |
| Plane coplanar with a face, solid on the **keep** side | No-op |
| Plane coplanar with a face, solid on the **remove** side | **Solid is deleted** (container count drops to 0) |
| `normal: [0,0,0]` | Silent no-op |

## Tested Solid Types

Box, sphere, cylinder, cone, extrusion (complex profile), boolean union result, multiple sequential slices — all ✅.

## Gotchas

- **Auto-scaling hides size changes** — a solo solid sliced in half snapshots identically. Verify numerically via `r.graphic.containers[].properties.min/max`, or include a reference body.
- No `updateSlice` / `deleteSlice` — one-shot destructive operation.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SliceDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result  // z -20..20

// Normal points UP → top removed; keepBoth: false discards it (default true keeps both)
await api.v1.solid.slice({ id: eifId, target: boxId, originPos: [0, 0, 0], normal: [0, 0, 1], keepBoth: false })
// boxId is now the bottom half (z -20..0) and still valid
```

## Related

`solid.section` (cross-section curves, non-destructive) · `solid.subtraction` (more complex cuts)
