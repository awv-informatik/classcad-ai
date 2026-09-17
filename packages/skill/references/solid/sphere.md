# solid.sphere

Creates a sphere primitive in an entity injection feature (EIF).

## Key Parameters

- `id` — EIF ID, **not** the part ID (wrong type → `"Provide only following id types: [\"entityinjection\"]"`)
- `radius` — sphere radius (required)
- `rotation`, `translation`, `rotateFirst` (default `true`) — optional; see `solid/generic`. Rotation is visually meaningless (symmetric) but affects internal representation; with `rotateFirst: false` plus both rotation and translation, the center orbits the origin → different final position.

## Return Value

Integer solid ID (e.g. `60`), maxLevel=31, messages=[]. On error `null`, maxLevel=51 with descriptive messages.

## Alignment

Centered at the origin before translation, like all `solid.*` primitives. `part.sphere` also centers (the only `part.*` primitive that does). See `references/part/feature-vs-direct.md`.

## Mesh Characteristics

Default tessellation: ~2000 vertices, ~3800 triangles (box: 36 vertices). 1 topological edge (seam), 2 topological vertices (poles).

## Gotchas

- **radius=0 is accepted without error** (returns an id, maxLevel 31) — degenerate sphere. Validate radius > 0 yourself.
- **Negative radius uses the absolute value** — `radius: -5` builds a radius-5 sphere (volume 523.6).
- Very small (0.001) and very large (10000) positive radii work fine.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"radius\" must be provided"` (code 1004, level 51) | Missing radius | Add `radius` |
| `"The parameter \"id\" has a wrong id type!"` (code 1001, level 51) | Part ID instead of EIF ID | Use `part.entityInjection` ID |
| Degenerate or unexpected sphere | radius ≤ 0 (0 → empty, negative → \|radius\|) | Validate radius > 0 |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

const sphereId = (await api.v1.solid.sphere({ id: eifId, radius: 50 })).result
const sphere2Id = (await api.v1.solid.sphere({ id: eifId, radius: 30, translation: [80, 0, 40] })).result
```

## Related

`solid/generic` · `solid.box` / `solid.cylinder` / `solid.cone` · `solid.deleteSolid` · `solid.copy` · `solid.translation` / `solid.rotation` / `solid.scale` · `solid.union` / `solid.subtraction` / `solid.intersection`
