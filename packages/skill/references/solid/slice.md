# solid.slice

Cuts a solid at a defined plane. The target solid is modified **in place** — no new solid is created (with `keepBoth: false`).

## keepBoth

- `keepBoth: true` (the default) keeps both halves: the target becomes one half and the call returns the id of the new solid holding the other half (80×60×40 box sliced at z=0: two solids, total volume 192000).
- `keepBoth: false` keeps only the negative side (see below) and returns nothing.

## Prerequisites

- A part with an entity injection feature (`part.entityInjection`)
- A solid inside that entity injection (any type: primitive, extrusion, revolve, boolean result)

## Key Parameters

- `id` — entity injection feature ID
- `target` — ID of the solid to slice
- `originPos` — `[x, y, z]` point on the cutting plane
- `normal` — `[x, y, z]` direction vector of the plane normal. **The side the normal points toward is REMOVED.** Does not need to be unit length — only direction matters.
- `keepBoth` — `true` (default): keep both halves, returns the id of the second solid; `false`: keep only the negative side.

## Doc Discrepancy: Normal Direction

The docs say "Part on the **negative** side of normal vector is removed." This is wrong. The actual behavior:

**The POSITIVE side (where the normal points) is removed. The NEGATIVE side (opposite the normal) is kept.**

Think of it as: the normal points toward the material to discard.

- `normal: [0,0,1]` at z=0 → keeps z < 0, removes z > 0
- `normal: [0,0,-1]` at z=0 → keeps z > 0, removes z < 0

## Return Value

With `keepBoth: false`: returns `null` (VOID). The target solid is modified in place. The original solid ID remains valid for subsequent operations.

## Edge Cases

### Non-intersecting plane → no-op

If the cutting plane does not touch or intersect the solid, nothing happens. No error, no messages, no change. The solid survives unchanged. This applies even when the entire solid is on the "remove" side of a non-touching plane.

### Plane coplanar with a face

- If the plane coincides with a face and the entire solid is on the **keep** side (negative side of normal): no-op, solid unchanged.
- If the plane coincides with a face and the entire solid is on the **remove** side (positive side of normal): **the solid is deleted** (container count drops to 0).

### Zero normal → silent no-op

Passing `normal: [0,0,0]` produces no error and no change. Silent no-op.

### Unnormalized normal

Normal vector magnitude is irrelevant. `[0,0,100]` behaves identically to `[0,0,1]`.

## Tested Solid Types

| Type | Result |
|------|--------|
| Box | ✅ works |
| Sphere | ✅ works |
| Cylinder | ✅ works |
| Cone | ✅ works |
| Extrusion (complex profile) | ✅ works |
| Boolean union result | ✅ works |
| Multiple sequential slices | ✅ works |

## Gotchas

- **Default `keepBoth` is `true`** — you get two solids. Pass `keepBoth: false` to discard the positive side.
- **Normal direction is opposite of docs.** The normal points toward the discarded side, not the kept side. The docs say "negative side removed" but actually the positive side is removed.
- **Centered geometry.** Primitives created without `translation` are centered at origin. A box with `height: 40` spans z=-20 to z=20, NOT z=0 to z=40. Plan your slice `originPos` accordingly.
- **Auto-scaling hides size changes.** Slicing a solo solid in half produces identical-looking snapshots. Use `r.graphic.containers[].properties.min/max` to verify bounding box changes numerically, or include a reference body.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SliceDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

// Create a box (centered: z goes from -20 to 20)
const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

// Slice: keep bottom half (z < 0), remove top half (z > 0)
// Normal points UP → top is removed
await api.v1.solid.slice({
  id: eifId,
  target: boxId,
  originPos: [0, 0, 0],
  normal: [0, 0, 1],
  keepBoth: false, // discard the top half (default true keeps both)
})
// boxId now references the bottom half (z: -20 to 0)
// boxId is still valid for subsequent operations
```

## Related

- `solid.section` — creates cross-section curves at a plane (non-destructive, next task)
- `solid.subtraction` — boolean subtraction for more complex cuts
- No `updateSlice` or `deleteSlice` exists — slice is a one-shot destructive operation
