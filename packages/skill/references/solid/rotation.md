# solid.rotation

Rotates a solid in place by `[rx, ry, rz]` radians, applied Z→Y→X (Euler angles), around the **part coordinate system origin** — not the body center.

## Key Parameters

- `id` — entity injection feature ID (part ID → code 1001)
- `target` — solid ID; wrong type → 1001, invalid/consumed (e.g. a tool after a `keepTools: false` boolean) → 1006
- `rotation` — `[rx, ry, rz]` in **radians** (π/2 ≈ 1.5708 = 90°, π = 180°, 2π = 360°). Required — code 1004 if omitted.

## Return Value

The **target solid ID** (same ID), maxLevel=31, messages=[].

## Behavior

- **Order Z→Y→X (intrinsic Euler):** Z first, then Y in the Z-rotated frame, then X in the ZY-rotated frame.
- **Combined = sequential in z → y → x order:** `[π/4, π/4, 0]` equals `[0, π/4, 0]` then `[π/4, 0, 0]` (both: COG (35.36, 25, −25) for an 80×40×20 box at x=50). The other order (x first, then y) differs. For predictable world-axis multi-axis rotations, make separate single-axis calls; combine in one call only if you mean Euler angles.
- **Orbits, doesn't spin:** a body at `[80, 0, 0]` rotated 90° about Z ends at `[0, 80, 0]`. To rotate around its own center: translate to origin → rotate → translate back. Hence `rotate → translate` ≠ `translate → rotate`.
- **Cumulative:** two `[0, 0, π/4]` calls = one `[0, 0, π/2]`. No `updateRotation`; undo by negating all components.
- **Zero vector** is a silent no-op. **Negative angles** = clockwise (positive = CCW, right-hand rule). **No upper bound** — >2π wraps (3π = 180°), no error.
- **Compound solids:** after a union, rotating the target moves the entire compound.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` | 1001 | Part ID instead of EIF ID |
| `"The parameter \"target\" has a wrong id type!"` | 1001 | Non-solid ID as target |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Invalid or consumed solid ID |
| `"The parameter \"rotation\" must be provided!"` | 1004 | Missing rotation |
| `"The parameter \"target\" must be provided!"` | 1004 | Missing target |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20 })).result

// 45° about Z — r.result === boxId, maxLevel 31
const r = await api.v1.solid.rotation({ id: eifId, target: boxId, rotation: [0, 0, Math.PI / 4] })

// Rotate around the body's own center: to origin → rotate → back
const box2 = (await api.v1.solid.box({ id: eifId, length: 50, width: 30, height: 20, translation: [100, 0, 0] })).result
await api.v1.solid.translation({ id: eifId, target: box2, translation: [-100, 0, 0] })
await api.v1.solid.rotation({ id: eifId, target: box2, rotation: [0, 0, Math.PI / 4] })
await api.v1.solid.translation({ id: eifId, target: box2, translation: [100, 0, 0] })
```

## Related

`solid.translation` · `solid.scale` · `solid.mirror` · `solid.copy`
