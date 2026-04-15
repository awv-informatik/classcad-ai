# solid.copy

Duplicates an existing solid body within an entity injection feature, with optional positioning via translation and rotation.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`) — the destination for the copy
- An existing solid to copy (from any entity injection in the same part)

## Key Parameters

- **`id`** — destination entity injection feature ID. Does NOT need to be the same EIF that contains the target solid — cross-EIF copy is supported.
- **`target`** — the solid ID to duplicate. Must be an actual solid (not an EIF, part, or curve). Accepts any solid type: primitives, extrusions, revolves, boolean results.
- **`translation`** — `[x, y, z]` offset. Applied after rotation by default.
- **`rotation`** — `[rx, ry, rz]` Euler angles in radians (ZYX order). Rotates around the **world origin**, not the solid's center.
- **`rotateFirst`** — boolean, default `true`. Controls transform order when both rotation and translation are given:
  - `true` (default): rotate around origin, then translate. "Orient, then place."
  - `false`: translate first, then rotate around origin. Creates an **orbital** pattern — ideal for distributing copies in a circle.

## Return Value

Returns the new solid's ID (`result: id`). Each copy gets a unique, incrementing ID. Returns `null` with maxLevel=51 on error.

## Behavior

- **No transform** → copy lands at exactly the same position as the original (overlapping). Both IDs are independently valid.
- **Copy is fully independent.** Modifying the original (boolean subtraction, translation, etc.) does NOT affect the copy. They share no state.
- **Preserves topology.** Boolean holes, complex extrusion profiles, and all B-rep features are faithfully duplicated. Vertex counts and edge counts match exactly.
- **First-class solid.** Copies can be used in any subsequent operation — boolean tools, transforms, further copies.
- **Cross-EIF supported.** The `id` (destination) can be a different entity injection than the one containing `target`.
- **Multiple copies.** You can copy the same source solid repeatedly — each copy is independent.

## Gotchas

- No `updateCopy` or `deleteCopy` exists. To remove a copy, use `solid.deleteSolid`. To reposition, use `solid.translation` / `solid.rotation`.
- Rotation always applies around the **world origin** `(0,0,0)`, not the solid's local center. For a box (corner-aligned at origin), this rotates around the corner.
- When copying with no transform, the copy perfectly overlaps the original. The renderer assigns different colors, but geometrically they're indistinguishable until one is moved.

## Common Errors

| Error code | Message | Cause |
|---|---|---|
| 1006 | `An element of parameter "target" has an invalid id!` | Target ID doesn't exist |
| 1006 | `An element of parameter "id" has an invalid id!` | EIF ID doesn't exist |
| 1001 | `The parameter "target" has a wrong id type! Provide only following id types: ["solid"]` | Target is an EIF, part, or other non-solid object |

All errors also include a warning (level 41): `"ToId()/TOID() didn't get an existing or valid id."` for non-existent ID cases.

## Usage Hints

- **Simple duplication at offset:** `{ id: eifId, target: solidId, translation: [80, 0, 0] }`
- **Circular pattern:** Use `rotateFirst: false` with a constant `translation` (radius) and varying `rotation` angle per copy. The translation places the solid at a radius, then rotation orbits it.
- **Copy for boolean:** Create a tool solid once, copy it multiple times, then use all copies as tools in a single subtraction/union.
- **Overlapping copy → separate later:** Copy with no transform, then use `solid.translation` / `solid.rotation` to independently position the copy.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'CopyDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Create a box
const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

// Simple copy with offset
const copy1 = (await api.v1.solid.copy({ id: eifId, target: boxId, translation: [80, 0, 0] })).result

// Circular pattern: 4 copies at 90° intervals
for (let i = 1; i <= 3; i++) {
  await api.v1.solid.copy({
    id: eifId,
    target: boxId,
    rotation: [0, 0, (i * Math.PI) / 2],
    translation: [80, 0, 0],
    rotateFirst: false,
  })
}
```

## Related

- `solid.deleteSolid` — remove a solid (including copies)
- `solid.translation` / `solid.rotation` — reposition a solid after creation
- `solid.union` / `solid.subtraction` — use copies as boolean tools
- Common parameters (`rotation`, `translation`, `rotateFirst`) documented in `solid/generic.md`
