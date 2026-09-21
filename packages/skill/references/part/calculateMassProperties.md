# part.calculateMassProperties

Calculates center of gravity (COG) and volume of a part, assembly, instance, or single solid. On a part/assembly, sums all contained solids and returns the volume-weighted COG.

## Key Parameters

- **`id`** — accepted types: `part/assembly`, `instance`, `solid`
  - **Part ID** → all solids in the part, COG in part-local coordinates
  - **Assembly ID** → all instances across the assembly tree, COG in assembly coordinates
  - **Instance ID** → that instance, COG in assembly coordinates (includes instance transformation)
  - **Solid ID** (from `solid.box`, `solid.sphere`, …) → single solid, COG in part-local coordinates
  - **NOT accepted:** feature IDs (`part.box`, `part.extrusion`, …), sketch IDs, work geometry IDs, entity injection feature IDs → error 1001

## Return Value

```js
{ result: { cog: { x, y, z }, volume: number } | null, messages: [], maxLevel: 31 }
```

- **`cog`** — `{ x, y, z }` **object**, NOT an `[x, y, z]` array (despite docs saying "point"). Use `result.cog.x`, not `result.cog[0]`.
- **`volume`** — mm³
- On error: `result: null`, `maxLevel: 51`

## Volume Accuracy

- **Box:** exact (72000 for 60×40×30)
- **Curved solids:** ~0.01–0.02% B-rep integration error
  - Sphere r=25: 65458.95 vs analytical 65449.85 (0.014%)
  - Cylinder d=30 h=50: 35342.21 vs 35342.92 (0.002%)
  - Truncated cone: ~0.002%

## COG Behavior

- Single symmetric solid: geometric center
- Multiple solids / assembly: volume-weighted average (assembly: instance COGs in assembly coordinates)
- Reflects post-boolean and post-fillet/chamfer geometry

## Gotchas

- **Feature IDs don't work** — most common mistake. Pass the part ID, not the ID returned by `part.box()` etc. Error: `"The parameter 'id' has a wrong id type! Provide only following id types: ['part/assembly','instance','solid']"`
- **Empty parts crash** — a part with no solid returns an internal NullMem server error, not a graceful zero volume. Ensure geometry exists first.
- **Enclosed voids are measured correctly** — a solid with an inner void shell reports outer − void (box 100×60×40 with an enclosed 80×40×20 void: exactly 176000).
- **Unchanged volume after a subtraction = the boolean left a sheet body**, not a measurement glitch: the call still answers with the pre-cut volume once, and the next call fails with `GetVolumeAndCOG: Division by zero!` plus a NullMem type error. See `boolean.md` → Gotchas.
- **Cone top diameter must be > 0** — `tDiameter: 0` is rejected at creation ("Value for top diameter must be greater than 0"). `0.001` works (volume within 0.0004% of the pointed cone).

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "wrong id type" | 1001 | Feature, sketch, work geometry, or entity injection ID |
| "invalid id" | 1006 | ID doesn't exist |
| NullMem evaluation error | 0 | Empty part (no solid) |
| `GetVolumeAndCOG: Division by zero!` + NullMem type error | 0 | The part holds a sheet body from a boolean that reported success |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })

const r = await api.v1.part.calculateMassProperties({ id: partId })
console.log(r.result.volume, r.result.cog.x, r.result.cog.y, r.result.cog.z) // 72000 30 20 15 (maxLevel 31)

// Single direct solid
const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
const solidId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
const rs = await api.v1.part.calculateMassProperties({ id: solidId })
console.log(rs.result) // { cog: { x: 0, y: 0, z: 0 }, volume: 24000 }
```

## Related

`part.box` / `part.sphere` / `part.cylinder` · `part.getGeometryIds` · `common.recalc`
