# assembly.calculateMassProperties

Calculates center of gravity (COG) and volume for an assembly, instance, part template, or individual solid. Aggregates across all instances in the assembly tree using volume-weighted averaging.

## Namespace Note

`assembly.calculateMassProperties` and `part.calculateMassProperties` are **identical** — same function exposed in two namespaces. Same inputs produce the same outputs. Use whichever namespace matches your context; there is no behavioral difference.

## Prerequisites

- The target must contain at least one solid body — empty assemblies, empty templates, and instances of empty templates all crash with a NullMem error (no graceful zero-volume return)

## Key Parameters

- **`id`** — the object to measure. Accepted types:
  - **Assembly root** → sums all instances recursively, COG in assembly coordinates
  - **Part template** → that template's geometry, COG in part-local coordinates
  - **Instance** (part or sub-assembly) → that instance's mass properties, COG in assembly coordinates (includes the instance transform)
  - **Solid ID** (from `solid.box`, `solid.sphere`, etc.) → single solid, COG in part-local coordinates

- **NOT accepted:**
  - **Assembly template** → error: "Getting model information of assembly templates is not supported yet!"
  - **Feature IDs** (`part.box`, `part.extrusion`, etc.) → error code 1001: "wrong id type"
  - **Work geometry IDs** → error code 1001
  - **Unexpanded sub-instance IDs** (instance IDs that live inside a sub-assembly, accessed directly rather than through the sub-assembly instance) → error: "use objects from expanded tree!"

## Return Value

```js
{
  result: { cog: { x, y, z }, volume: number } | null,
  messages: [],
  maxLevel: 31  // info level on success, 51 on error
}
```

- **`cog`** — center of gravity as `{ x, y, z }` object (NOT `[x, y, z]` array)
- **`volume`** — in mm³
- On error: `result: null`, `maxLevel: 51`

## Aggregation Rules

- **Assembly root** → volume-weighted COG across all instances in the tree. Formula: `COG = Σ(Vi * COGi) / Σ(Vi)` where Vi and COGi are each instance's volume and COG in assembly coordinates.
- **Sub-assembly instance** → recurses into nested instances, aggregates their COGs into the sub-assembly's world frame.
- **Instance COG is always in assembly coordinates** — the instance transform (translation + rotation) is applied to the template's local COG.

## Gotchas

- **Assembly templates fail** — you can measure an instance of a sub-assembly, but not the sub-assembly template itself. Use instances.
- **Unexpanded sub-instance IDs fail** — if instance B lives inside sub-assembly template S, and you instantiate S as instance A in the root assembly, you cannot pass B's ID directly. Pass A's ID (the sub-assembly instance) instead.
- **Empty anything crashes** — no graceful zero-volume return. Always ensure geometry exists before calling.
- **COG is `{x,y,z}` not `[x,y,z]`** — access via `result.cog.x`, not `result.cog[0]`.

## Common Errors

| Error | Code | Cause |
|---|---|---|
| "not supported yet" | 0 | Passed an assembly template ID |
| "wrong id type" | 1001 | Passed a feature, sketch, work geometry, or entity injection ID |
| "invalid id" | 1006 | ID doesn't exist |
| NullMem evaluation error | 0 | Empty assembly/template (no solids) |
| "use objects from expanded tree" | 0 | Passed a sub-instance ID directly instead of through its parent instance |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tplId = (await api.v1.assembly.partTemplate({})).result
await api.v1.part.box({ id: tplId, name: 'Box', length: 60, width: 40, height: 30 })
await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'A' })).result
const inst2 = (await api.v1.assembly.instance({
  productId: tplId, ownerId: asmId, name: 'B',
  transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
})).result

// Assembly root — aggregated
const rAsm = await api.v1.assembly.calculateMassProperties({ id: asmId })
// rAsm.result = { cog: { x: 80, y: 20, z: 15 }, volume: 144000 }

// Individual instance — in assembly coordinates
const rInst = await api.v1.assembly.calculateMassProperties({ id: inst2 })
// rInst.result = { cog: { x: 130, y: 20, z: 15 }, volume: 72000 }
```

## Related

- `part.calculateMassProperties` — identical function in part namespace
- `assembly.instance` — create instances whose mass properties you can measure
- `assembly.transformInstance` — reposition instances (changes their COG in assembly coords)
