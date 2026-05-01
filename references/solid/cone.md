# solid.cone

Creates a cone or frustum primitive solid within an entity injection feature. A cone is defined by its height and two diameters (bottom and top). Setting one diameter to 0 creates a pointed cone; equal diameters create a cylinder-like shape.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`) — pass the EIF ID as `id`, **not** the part ID

## Key Parameters

- `id` — entity injection feature ID (not part ID). Error message is clear if wrong type: `"Provide only following id types: [\"entityinjection\"]"`
- `height` — total height along Z-axis (required). Cone extends from z=-height/2 to z=+height/2.
- `bDiameter` — diameter at the bottom (z=-height/2) of the cone (required). This is diameter, **not radius**.
- `tDiameter` — diameter at the top (z=+height/2) of the cone (required). This is diameter, **not radius**.
- `translation` — `[x, y, z]` offset from origin (optional)
- `rotation` — `[rx, ry, rz]` rotation in **radians** around each axis (optional)
- `rotateFirst` — boolean, default `true`. Controls transform order when both rotation and translation are provided:
  - `true` (default): rotate around origin first, then translate
  - `false`: translate first, then rotate around origin — the cone ends up orbiting the origin

## Return Value

Returns an **integer solid ID** on success (e.g., `61`). maxLevel=31 on success, messages=[].

On error, returns `null` with maxLevel=51 and descriptive error messages.

## Alignment

The cone is **fully centered at the origin** — centered in XY (circular cross-section around x=0, y=0) AND centered in Z (extends from z=-height/2 to z=+height/2).

All four `solid.*` primitives (`box`, `cylinder`, `cone`, `sphere`) follow the same convention: fully centered at the origin before any translation. A `solid.cone(h=100)` and a `solid.cylinder(h=100)` both span z=-50..+50 in their default position. **`part.cone` is DIFFERENT** — base-anchored at z=0, extends to z=+H. See `references/part/feature-vs-direct.md` for the conventions table.

Note that a frustum's center-of-gravity is **not** at z=0 even though it's z-centered geometrically — mass is biased toward the larger end. For `bDiameter=40, tDiameter=10, height=80`, COG sits at roughly z=-14.3 (toward the base). This is correct behavior, not misalignment.

## Gotchas

- **`tDiameter: 0` works for a true pointed cone.** The docs examples use `0.1`, but `0` is valid. No error, no degenerate geometry — creates a proper pointed cone.
- **`bDiameter: 0` works for an inverted pointed cone.** Diameters are fully symmetric — either can be 0 or larger than the other.
- **Equal diameters create a cylinder-like shape.** `bDiameter: 50, tDiameter: 50` produces a cylinder. Not an error.
- **Zero dimensions are accepted silently.** `height: 0` creates degenerate flat geometry. No error, no warning, maxLevel=31. **Always validate dimensions > 0 before calling.**
- **Negative dimensions are accepted silently.** Same as box/cylinder — creates internal geometry. maxLevel=31, no error.
- **Validation order differs from other primitives.** Missing params are reported in order: `bDiameter → height → tDiameter`. When all three are missing, `bDiameter` is reported first. Compare: cylinder checks `height → diameter`, box checks `length → width → height`.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"bDiameter\" must be provided"` (level 51) | Missing bDiameter | Add the parameter |
| `"The parameter \"height\" must be provided"` (level 51) | Missing height | Add the parameter |
| `"The parameter \"tDiameter\" must be provided"` (level 51) | Missing tDiameter | Add the parameter |
| `"The parameter \"id\" has a wrong id type!"` (level 51) | Passed part ID instead of EIF ID | Use the ID from `part.entityInjection`, not `part.create` |

## Usage Hints

- Multiple cones can coexist in one entity injection feature — each gets its own solid ID
- Use `solid.deleteSolid({ id: eifId, ids: [coneId] })` to remove specific cones. Omit `ids` to clear all solids.
- For boolean operations, create multiple solids in the same EIF first, then combine them
- All `solid.*` primitives share the same origin-centered convention, so cone/cylinder/box/sphere with matching `height` will share Z extent without extra translation

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Frustum (truncated cone)
const frustumId = (await api.v1.solid.cone({
  id: eifId,
  height: 100,
  bDiameter: 60,
  tDiameter: 20
})).result

// True pointed cone, translated
const pointedId = (await api.v1.solid.cone({
  id: eifId,
  height: 80,
  bDiameter: 40,
  tDiameter: 0,
  translation: [100, 0, 0]
})).result
```

## Related

- `solid.deleteSolid` — remove solids from an EIF
- `solid.copy` — duplicate a solid with optional transform
- `solid.translation` / `solid.rotation` / `solid.scale` — transform existing solids
- `solid.union` / `solid.subtraction` / `solid.intersection` — boolean operations between solids
- `part.entityInjection` — create the required EIF container
- `solid.cylinder` — similar primitive (also fully centered at origin)
- `solid.box` — similar primitive (also fully centered at origin)
- `solid.sphere` — similar primitive (centered at origin)
