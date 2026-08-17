# part.calculateMassProperties

Calculates the center of gravity (COG) and volume of a part, assembly, instance, or individual solid. When called on a part or assembly, sums all contained solids and returns the volume-weighted COG.

## Prerequisites

- The target must contain at least one solid body — **empty parts crash** with an internal NullMem error (no graceful zero-volume return)

## Key Parameters

- **`id`** — accepted types: `part/assembly`, `instance`, `solid`
  - **Part ID** → sums all solids in the part, COG in part-local coordinates
  - **Assembly ID** → sums all instances across the assembly tree, COG in assembly coordinates
  - **Instance ID** → that instance's mass properties in assembly coordinates
  - **Solid ID** (from `solid.box`, `solid.sphere`, etc.) → single solid, COG in part-local coordinates
  - **NOT accepted:** feature IDs (`part.box`, `part.extrusion`, etc.), sketch IDs, work geometry IDs, entity injection feature IDs → error 1001

## Return Value

```js
{
  result: { cog: { x, y, z }, volume: number } | null,
  messages: [],
  maxLevel: 31  // info level on success
}
```

- **`cog`** — center of gravity as `{ x, y, z }` **object** (NOT an `[x, y, z]` array, despite docs saying "point")
- **`volume`** — in mm³ (consistent with mm coordinate system)
- On error: `result: null`, `maxLevel: 51`

## Volume Accuracy

- **Box:** exact (72000 for 60×40×30)
- **Curved solids:** small numerical error from B-rep integration (~0.01–0.02%)
  - Sphere r=25: 65458.95 vs analytical 65449.85 (0.014% off)
  - Cylinder d=30 h=50: 35342.21 vs analytical 35342.92 (0.002% off)
  - Truncated cone: ~0.002% off

## COG Behavior

- **Single symmetric solid:** COG at geometric center
- **Multiple solids:** volume-weighted average of all solid COGs
- **Assembly:** sums across all instances; instance COGs reported in assembly coordinates
- **After boolean:** reflects the post-operation geometry (material removed/added)
- **After fillet/chamfer:** reflects material removal from rounding

## Gotchas

- **Feature IDs don't work** — the most common mistake. Use the part ID, not the feature ID returned by `part.box()` etc. Error: `"The parameter 'id' has a wrong id type! Provide only following id types: ['part/assembly','instance','solid']"`
- **Empty parts crash** — calling on a part with no solid geometry returns a NullMem server error, not a graceful zero. Always ensure geometry exists first.
- **Degenerate cones crash** — `part.cone` with `tDiameter=0` (or very small values like 0.001) causes the same NullMem crash. Workaround: use `tDiameter >= 1`.
- **COG is `{x,y,z}` not `[x,y,z]`** — despite the docs describing the return as `point`, the COG comes back as an object with named keys, not an array. Access via `result.cog.x`, not `result.cog[0]`.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "wrong id type" | 1001 | Passed a feature, sketch, work geometry, or entity injection ID |
| "invalid id" | 1006 | ID doesn't exist |
| NullMem evaluation error | 0 | Empty part or degenerate cone (tDiameter=0) |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

const r = await api.v1.part.calculateMassProperties({ id: partId })
// r.result = { cog: { x: 30, y: 20, z: 15 }, volume: 72000 }
// r.maxLevel = 31

console.log('Volume:', r.result.volume)          // 72000
console.log('COG:', r.result.cog.x, r.result.cog.y, r.result.cog.z)  // 30 20 15
```

### With direct solids (individual solid mass props)

```js
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
const solidId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

const r = await api.v1.part.calculateMassProperties({ id: solidId })
// r.result = { cog: { x: 0, y: 0, z: 0 }, volume: 24000 }
```

### Assembly level

```js
// Assembly sums all instances
const rAsm = await api.v1.part.calculateMassProperties({ id: asmId })
// rAsm.result.volume = sum of all instance volumes
// rAsm.result.cog = volume-weighted COG in assembly coordinates

// Individual instance
const rInst = await api.v1.part.calculateMassProperties({ id: instanceId })
// rInst.result.cog in assembly coordinates (includes instance transformation)
```

## Related

- `part.box` / `part.sphere` / `part.cylinder` — create geometry to measure
- `part.getGeometryIds` — find brep elements by position
- `common.recalc` — ensure geometry is up-to-date before measuring
