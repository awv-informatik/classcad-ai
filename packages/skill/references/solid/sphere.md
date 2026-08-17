# solid.sphere

Creates a sphere primitive solid within an entity injection feature.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`) — pass the EIF ID as `id`, **not** the part ID

## Key Parameters

- `id` — entity injection feature ID (not part ID). Error message is clear if wrong type: `"Provide only following id types: [\"entityinjection\"]"`
- `radius` — sphere radius (required). Must be > 0.
- `translation` — `[x, y, z]` offset from origin (optional)
- `rotation` — `[rx, ry, rz]` rotation in **radians** around each axis (optional). Visually meaningless for a sphere (rotationally symmetric), but affects internal representation and interacts with `rotateFirst`.
- `rotateFirst` — boolean, default `true`. Controls transform order when both rotation and translation are provided. Even though a sphere's shape is symmetric, `rotateFirst` changes the final center position:
  - `true` (default): rotate around origin first (no visual effect), then translate
  - `false`: translate first, then rotate around origin — the center orbits the origin

## Return Value

Returns an **integer solid ID** on success (e.g., `60`). maxLevel=31 on success, messages=[].

On error, returns `null` with maxLevel=51 and descriptive error messages.

## Alignment

The sphere is **centered at the origin** — its center sits at (0,0,0) before any translation is applied. All `solid.*` primitives (`box`, `cylinder`, `cone`, `sphere`) share this origin-centered convention. `part.sphere` also centers (the only `part.*` primitive that does); `part.box`/`part.cylinder`/`part.cone` are corner-anchored or base-anchored. See `references/part/feature-vs-direct.md` for the conventions table.

## Mesh Characteristics

Default tessellation produces ~2000 vertices and ~3800 triangles. The sphere has 1 topological edge (seam) and 2 topological vertices (poles). Much denser mesh than a box (36 vertices).

## Gotchas

- **radius=0 hangs the server.** No error, no timeout — the worker goes to 100% CPU and must be killed. This is worse than `solid.box` which silently accepts zero dimensions.
- **Negative radius hangs the server.** Same behavior as radius=0. **Always validate radius > 0 before calling.**
- Very small (0.001) and very large (10000) positive radii work fine.
- Rotation has no visual effect on a sphere (it's rotationally symmetric), but `rotateFirst=false` with both rotation and translation will orbit the sphere's center around the origin, producing a different final position.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"radius\" must be provided"` (code 1004, level 51) | Missing radius | Add `radius` parameter |
| `"The parameter \"id\" has a wrong id type!"` (code 1001, level 51) | Passed part ID instead of EIF ID | Use the ID from `part.entityInjection`, not `part.create` |
| Server hang (100% CPU, no response) | radius ≤ 0 | Kill worker, restart, always validate radius > 0 |

## Usage Hints

- Multiple spheres can coexist in one entity injection feature — each gets its own solid ID
- Use `solid.deleteSolid({ id: eifId, ids: [sphereId] })` to remove specific spheres
- Spheres mix freely with other primitives (box, cylinder, cone) in the same EIF

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Basic sphere centered at origin
const sphereId = (await api.v1.solid.sphere({
  id: eifId,
  radius: 50
})).result

// Translated sphere
const sphere2Id = (await api.v1.solid.sphere({
  id: eifId,
  radius: 30,
  translation: [80, 0, 40]
})).result
```

## Related

- `solid.box` / `solid.cylinder` / `solid.cone` — other primitive solids
- `solid.deleteSolid` — remove solids from an EIF
- `solid.copy` — duplicate a solid with optional transform
- `solid.translation` / `solid.rotation` / `solid.scale` — transform existing solids
- `solid.union` / `solid.subtraction` / `solid.intersection` — boolean operations between solids
- `part.entityInjection` — create the required EIF container
