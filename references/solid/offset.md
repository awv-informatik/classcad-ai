# solid.offset

Offsets all faces of a solid by a given distance. The target solid is modified **in place** — the returned ID is the same as the target ID. No new solid is created.

**This API is fragile.** It can hang the server on complex topology. Use only on simple solids with a timeout/watchdog.

## Prerequisites

- A part with an entity injection feature (`part.entityInjection`)
- A solid inside that entity injection (any primitive, extrusion, revolve, or simple boolean result)

## Key Parameters

- `id` — entity injection feature ID (same as for `solid.box`, etc.)
- `target` — ID of the solid to offset
- `distance` — offset distance. Positive = outward, negative = inward
- `extend` (optional, default `FALSE`) — controls how edge gaps are handled:
  - `FALSE` — fills gaps between offset faces with **fillet surfaces** (radius = distance). Changes topology (adds faces/edges). Produces rounded results.
  - `TRUE` — extends surfaces beyond their trimming curves to meet each other. **Preserves topology** (same face/edge count). Produces sharp-edged results.

## Return Value

Returns the **same ID** as the target. The solid is modified in place. `r.result === targetId` is always `true`.

## Gotchas

### Server hang on complex topology (CRITICAL)

Offsetting a solid with multiple boolean operations (e.g., 3+ cylinder holes) can cause the server to **hang permanently** at 100% CPU. There is no error, no timeout, no response — the server becomes completely unresponsive and must be `kill -9`'d. Always use a timeout when calling offset.

**Safe:** primitives (box, sphere, cylinder, cone), single extrusions/revolves, solids with a single boolean cut.

**Dangerous:** solids with multiple boolean operations, complex fillets, or many edges.

### Negative distance with extend: FALSE produces degenerate geometry

`extend: FALSE` (default) with negative distance produces self-intersecting geometry. Faces move inward but the fillet algorithm can't create negative-radius fillets, resulting in faces protruding beyond corners. The API returns success with no error.

**Rule: for inward (negative) offset, always use `extend: TRUE`.**

### No distance validation

The API does not check whether the distance is geometrically feasible. A negative distance larger than half the smallest dimension collapses the solid into a degenerate flat shape — no error, no warning. The caller must ensure `|distance| < half_smallest_dimension`.

### Zero distance is a no-op

`distance: 0` is accepted without error. The solid is unchanged — no fillets added, no geometry modified.

## extend: FALSE vs TRUE comparison

| Aspect | `extend: FALSE` (default) | `extend: TRUE` |
|--------|---------------------------|-----------------|
| Edge treatment | Fillet surfaces added | Sharp edges preserved |
| Topology | Changes (more faces/edges) | Preserved (same count) |
| Positive distance | Rounded, larger solid | Sharp, larger solid |
| Negative distance | **Degenerate** (self-intersecting) | Clean, smaller solid |
| Concave corners | Fills with concave fillets (may have artifacts) | Clean sharp corners |
| Best for | Shell-like results, rounded edges | Uniform scaling of geometry |

## Tested Solid Types

| Type | extend: FALSE | extend: TRUE |
|------|---------------|--------------|
| Box | ✅ fillets at edges | ✅ sharp larger box |
| Sphere | ✅ trivial (radius grows) | ✅ same |
| Cylinder | ✅ fillets at top/bottom edges | ✅ sharp |
| Cone | ✅ fillets at edges | not tested |
| L-shape extrusion | ✅ works, minor artifacts at inner corner | ✅ clean |
| Revolve (torus) | ✅ fillets at edges | not tested |
| Boolean (1 hole) | ✅ hole shrinks, fillets added | ✅ hole shrinks, sharp |
| Boolean (3+ holes) | ❌ **SERVER HANG** | not tested (likely hangs too) |

## Common Errors

No error messages observed in any test — the API either succeeds silently (maxLevel: 31) or hangs the server. There is no graceful failure mode.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'OffsetDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

// Create a box
const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

// Outward offset with rounded edges (extend: FALSE is default)
const r1 = await api.v1.solid.offset({ id: eifId, target: boxId, distance: 5 })
// r1.result === boxId (in-place modification, filleted edges)

// OR: outward offset with sharp edges
const r2 = await api.v1.solid.offset({ id: eifId, target: boxId, distance: 5, extend: true })
// r2.result === boxId (in-place modification, sharp edges preserved)

// Inward offset — ALWAYS use extend: true
const r3 = await api.v1.solid.offset({ id: eifId, target: boxId, distance: -3, extend: true })
// r3.result === boxId (smaller box with sharp edges)
```

## Related

- `solid.scale` — uniform scaling (simpler, always works, but scales from origin)
- `solid.fillet` — add fillets to specific edges (more controlled than offset's automatic fillets)
- No `updateOffset` or `deleteOffset` exists — offset is a one-shot operation
