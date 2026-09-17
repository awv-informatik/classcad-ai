# assembly.calculateMassProperties

Center of gravity (COG) and volume of an assembly, instance, part template, or solid. `assembly.calculateMassProperties` and `part.calculateMassProperties` are **identical** (same function, two namespaces).

## Key Parameters

`id` — the object to measure:

| Accepted | Result |
|---|---|
| Assembly root | All instances recursively, volume-weighted `COG = Σ(Vi·COGi) / Σ(Vi)`, assembly coordinates |
| Part template | Template geometry, part-local coordinates |
| Instance (part or sub-assembly) | That instance, assembly coordinates (instance translation + rotation applied); sub-assembly instances recurse into nested instances |
| Solid ID (`solid.box`, `solid.sphere`, …) | Single solid, part-local coordinates |

| Rejected | Error |
|---|---|
| Assembly template | "Getting model information of assembly templates is not supported yet!" (code 0) — measure an instance instead |
| Feature (`part.box`, `part.extrusion`, …), sketch, work geometry, entity injection IDs | 1001 "wrong id type" |
| Unexpanded sub-instance IDs (instance B inside sub-assembly template S, passed directly) | "use objects from expanded tree!" (code 0) — pass the instance A of S instead |
| Nonexistent ID | 1006 "invalid id" |
| Empty assembly, empty template, or instance of an empty template | NullMem evaluation error (code 0) — no zero-volume return; ensure geometry exists |

## Return Value

```js
{ result: { cog: { x, y, z }, volume: number } | null, messages: [], maxLevel: 31 }
```

- `cog` is an object — `result.cog.x`, NOT `result.cog[0]`
- `volume` in mm³
- Error: `result: null`, maxLevel 51

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({})).result
await api.v1.part.box({ id: tplId, name: 'Box', length: 60, width: 40, height: 30 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })
const inst2 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'B',
  transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

const rAsm = await api.v1.assembly.calculateMassProperties({ id: asmId })
// { cog: { x: 80, y: 20, z: 15 }, volume: 144000 }
const rInst = await api.v1.assembly.calculateMassProperties({ id: inst2 })
// { cog: { x: 130, y: 20, z: 15 }, volume: 72000 }
```

## Related

`part.calculateMassProperties` · `assembly.instance` · `assembly.transformInstance`
