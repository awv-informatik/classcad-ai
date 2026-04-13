# solid.cylinder

Creates a cylinder primitive solid within an entity injection feature.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`) — pass the EIF ID as `id`, **not** the part ID

## Key Parameters

- `id` — entity injection feature ID (not part ID). Error message is clear if wrong type: `"Provide only following id types: [\"entityinjection\"]"`
- `height` — Z-dimension, extends from z=0 to z=height (required)
- `diameter` — full diameter of the circular cross-section (required). This is diameter, **not radius**.
- `translation` — `[x, y, z]` offset from origin (optional)
- `rotation` — `[rx, ry, rz]` rotation in **radians** around each axis (optional)
- `rotateFirst` — boolean, default `true`. Controls transform order when both rotation and translation are provided:
  - `true` (default): rotate around origin first, then translate
  - `false`: translate first, then rotate around origin — the cylinder ends up orbiting the origin

## Return Value

Returns an **integer solid ID** on success (e.g., `61`). maxLevel=31 on success, messages=[].

On error, returns `null` with maxLevel=51 and descriptive error messages.

## Alignment

The cylinder is **axis-centered** — the circular cross-section is centered at the origin (x=0, y=0) and the cylinder extends from z=0 to z=height along the Z-axis. This differs from `solid.box` which is corner-aligned.

## Gotchas

- **Zero dimensions are accepted silently.** `height: 0` creates a degenerate flat disk, `diameter: 0` creates a degenerate line/point. No error, no warning, maxLevel=31. **Always validate dimensions > 0 before calling.**
- **Negative dimensions are accepted silently.** They create internal geometry that the renderer cannot display. No error, no warning, maxLevel=31.
- **Parameter is `diameter`, not `radius`.** Easy to confuse — a cylinder with `diameter: 50` has radius 25.
- **Required params are validated in order:** id → height → diameter. If multiple are missing, only the first missing one is reported.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"height\" must be provided"` (level 51) | Missing required dimension | Add the missing parameter |
| `"The parameter \"diameter\" must be provided"` (level 51) | Missing required dimension | Add the missing parameter |
| `"The parameter \"id\" has a wrong id type!"` (level 51) | Passed part ID instead of EIF ID | Use the ID from `part.entityInjection`, not `part.create` |

## Usage Hints

- Multiple cylinders can coexist in one entity injection feature — each gets its own solid ID
- Use `solid.deleteSolid({ id: eifId, ids: [cylId] })` to remove specific cylinders. Omit `ids` to clear all solids.
- For boolean operations (union, subtraction, intersection), create multiple solids in the same EIF first, then combine them

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Basic cylinder at origin — centered in XY, extends along Z
const cylId = (await api.v1.solid.cylinder({
  id: eifId,
  height: 100,
  diameter: 50
})).result

// Translated + rotated cylinder
const cyl2Id = (await api.v1.solid.cylinder({
  id: eifId,
  height: 80,
  diameter: 30,
  translation: [80, 0, 0],
  rotation: [Math.PI / 2, 0, 0]  // 90° around X — lies along Y
})).result
```

## Related

- `solid.deleteSolid` — remove solids from an EIF
- `solid.copy` — duplicate a solid with optional transform
- `solid.translation` / `solid.rotation` / `solid.scale` — transform existing solids
- `solid.union` / `solid.subtraction` / `solid.intersection` — boolean operations between solids
- `part.entityInjection` — create the required EIF container
- `solid.box` — similar primitive, but corner-aligned instead of axis-centered
- `solid.sphere` — similar primitive (centered at origin)
- `solid.cone` — similar primitive with two diameters
