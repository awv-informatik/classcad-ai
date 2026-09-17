# solid.offset

Offsets all faces of a solid by a distance. Modified **in place** — returns the target ID (`r.result === targetId` always); no new solid.

**Fragile** (as its own docstring warns): only works where every face can be offset and re-trimmed *without changing the topology* (same face/edge count). Otherwise it may produce degenerate geometry or return an error (maxLevel 51) — but in re-testing it does **not** hang the server.

## Key Parameters

- `id` — entity injection feature ID (as for `solid.box`)
- `target` — solid to offset (any primitive, extrusion, revolve, or boolean result)
- `distance` — positive = outward, negative = inward
- `extend` (optional, default `FALSE`):
  - `FALSE` — fills gaps between offset faces with **fillet surfaces** (radius = distance). Changes topology; rounded result.
  - `TRUE` — extends surfaces past their trimming curves to meet. **Preserves topology**; sharp result.

## extend: FALSE vs TRUE

| Aspect | `extend: FALSE` (default) | `extend: TRUE` |
|--------|---------------------------|-----------------|
| Edge treatment | Fillet surfaces added | Sharp edges preserved |
| Topology | Changes (more faces/edges) | Preserved (same count) |
| Positive distance | Rounded, larger solid | Sharp, larger solid |
| Negative distance | **Degenerate** (self-intersecting) | Clean, smaller solid |
| Concave corners | Concave fillets (may have artifacts) | Clean sharp corners |
| Best for | Shell-like results, rounded edges | Uniform scaling of geometry |

## Tested Solid Types

| Type | extend: FALSE | extend: TRUE |
|------|---------------|--------------|
| Box | ✅ fillets at edges | ✅ sharp larger box |
| Sphere | ✅ trivial (radius grows) | ✅ same |
| Cylinder | ✅ fillets at top/bottom edges | ✅ sharp |
| Cone | ✅ fillets at edges | not tested |
| L-shape extrusion | ✅ minor artifacts at inner corner | ✅ clean |
| Revolve (torus) | ✅ fillets at edges | not tested |
| Boolean (1 hole) | ✅ hole shrinks, fillets added | ✅ hole shrinks, sharp |
| Boolean (multiple holes) | ✅ maxLevel 31 (see hang note) | — |

## Gotchas

- **Negative distance with `extend: FALSE` → degenerate, self-intersecting geometry** (fillets can't have negative radius; faces protrude past corners), reported as success. **For inward offsets always use `extend: TRUE`.**
- **No distance validation.** A negative distance larger than half the smallest dimension collapses the solid to a degenerate flat shape, no error. Ensure `|distance| < half_smallest_dimension`.
- **`distance: 0` is a no-op** (no error, nothing changed).
- **Offset does not hang — a STEP export over corrupt state does.** Offset handles plain, holed and multi-cut boxes promptly. The historically reported "hang" was a STEP export (`snapshot`) taken **after a multi-tool `solid.subtraction` had silently failed**: over that partial part state the export spins at 100% CPU. A multi-tool subtraction normally equals sequential calls (plate minus 3 cylinders: identical, exact volume), but in one session it returned `nonmanifold` (maxLevel 51) and left the target partially cut. **Check every boolean's `maxLevel` before continuing or exporting.** The export-hangs-on-corrupt-state issue is separate and not offset-specific (see the `common.clear` + export hang entry in the project TODO).
- No `updateOffset` / `deleteOffset` — one-shot operation.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'OffsetDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

// Outward, sharp edges (omit extend for rounded edges)
const r1 = await api.v1.solid.offset({ id: eifId, target: boxId, distance: 5, extend: true })
// r1.result === boxId

// Inward — ALWAYS extend: true
const r2 = await api.v1.solid.offset({ id: eifId, target: boxId, distance: -3, extend: true })
```

## Related

`solid.scale` (uniform scaling — simpler, always works, but scales from origin) · `solid.fillet` (fillets on specific edges, more controlled)
