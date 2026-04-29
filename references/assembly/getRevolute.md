# assembly.getRevolute

Retrieves a revolute constraint by name from an assembly. Returns the full constraint definition including both mates, offset, and rotation limits.

## Prerequisites

- An assembly with at least one revolute constraint
- The constraint name (exact match required)

## Key Parameters

- `id` (required) — the **assembly ID** or a **sub-assembly instance ID**. Part instance IDs, constraint IDs, and part template IDs all fail.
- `name` (required) — constraint name to look for. Returns first match if duplicates exist.

## Return Value

On success (maxLevel 31):

```js
{
  id: number,         // constraint ID
  name: string,       // constraint name
  mate1: {
    path: number[],   // instance ID(s)
    csys: number,     // WCS ID
    flip: string,     // "Z" | "-Z" | "X" | "-X" | "Y" | "-Y"
    reorient: string, // "0" | "90" | "180" | "270"
  },
  mate2: {
    path: number[],   // instance ID(s)
    csys: number,     // WCS ID
    flip: string,     // "Z" | "-Z" | "X" | "-X" | "Y" | "-Y"
    reorient: string, // "0" | "90" | "180" | "270"
  },
  zOffset: number,
  zRotationLimits: {
    min: number | null,  // radians, null = no limit
    max: number | null,
  },
}
```

**All fields always present.** Default values (flip="Z", reorient="0", zOffset=0, zRotationLimits={min:null, max:null}) are explicitly returned — never omitted.

**Does NOT include current rotation angle** — only the constraint definition parameters.

On error (maxLevel 51): `null`

## Difference from getFastenedOrigin

- **getFastenedOrigin** returns: `mate1` (single mate), 6 offset/rotation fields (`xOffset`, `yOffset`, `zOffset`, `xRotation`, `yRotation`, `zRotation`)
- **getRevolute** returns: `mate1` + `mate2` (two mates), `zOffset` (single offset), `zRotationLimits` (min/max object)

## Batch Retrieval

Pass array of param objects:

```js
const r = await api.v1.assembly.getRevolute([
  { id: asmId, name: 'Rev_A' },
  { id: asmId, name: 'Rev_B' },
])
// r.result → array of constraint objects (or null for not-found entries)
```

Invalid entries return `null` in their slot — the batch is not rejected wholesale. maxLevel reflects the worst case (51 if any entry fails).

## ID Acceptance Rules

| ID type | Works? | Error |
|---|---|---|
| Assembly ID (root or template) | Yes | — |
| Sub-assembly instance ID | Yes — resolves to the sub-assembly template | — |
| Part instance ID | No | "The provided product or product reference id is not a Assembly." |
| Constraint ID | No | code 1001, "wrong id type! Provide only following id types: [\"assembly\",\"instance\"]" |
| Part template ID | No | code 1001, same as constraint ID |

## Constraint Scope

Constraints are scoped to the assembly they were created in. Looking up a constraint that lives on a sub-assembly from the root assembly returns null — you must query the sub-assembly (by template ID or instance ID).

## Gotchas

- **zRotationLimits always returned as radians**, even if originally created with `'-45deg'` string syntax. Values are numeric (`typeof === 'number'`).
- **First match wins** when multiple constraints share the same name.
- **Cross-type name collision** — all get* methods find the FIRST constraint by name regardless of type. If a cylindrical was created before a revolute with the same name, `getRevolute` will fail because the cylindrical is found first. Use unique names across constraint types.
- **After rename via `updateRevolute`**, the old name returns null. Only the new name works.
- **Reflects current state after updates.** Always shows the latest values.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"name" must be provided in the api call!` | Missing name param | 1004 |
| `"id" must be provided in the api call!` | Missing id param | 1004 |
| `There couldn't be found a constraint with name "X" on product or product reference with id $N` | No constraint with that name on this assembly | 0 |
| `The provided product or product reference id is not a Assembly.` | Part instance ID (not a sub-assembly) | 0 |
| `The parameter "id" has a wrong id type! Provide only following id types: ["assembly","instance"]` | Constraint ID, part template ID, or other non-assembly/instance type | 1001 |

## Working Example

```js
const asmId = (await api.v1.assembly.create({ name: 'HingeAsm' })).result

const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
await api.v1.part.box({ id: tpl1, name: 'Plate', length: 80, width: 50, height: 10 })
const wcs1 = (await api.v1.part.workCSys({
  id: tpl1, name: 'WCS1', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
await api.v1.part.box({ id: tpl2, name: 'Arm', length: 60, width: 20, height: 15 })
const wcs2 = (await api.v1.part.workCSys({
  id: tpl2, name: 'WCS2', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result

await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

const cId = (await api.v1.assembly.revolute({
  id: asmId, name: 'Hinge',
  mate1: { path: [inst1], csys: wcs1 },
  mate2: { path: [inst2], csys: wcs2 },
  zOffset: 5,
  zRotationLimits: { min: '-90deg', max: '120deg' },
})).result

const g = (await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge' })).result
// g.id → constraint ID
// g.zOffset → 5
// g.zRotationLimits.min → -1.5708 (radians, not '-90deg')
// g.zRotationLimits.max → 2.0944 (radians)
// g.mate1.flip → "Z" (default)
// g.mate2.reorient → "0" (default)
```

## Related

- `assembly.revolute` — create the constraint
- `assembly.updateRevolute` — modify the constraint
- `assembly.deleteConstraint` — delete constraints (use `ids` array, not `id`)
- `assembly.getFastenedOrigin` — similar getter for fastenedOrigin constraints
- `assembly.getFastened` — similar getter for fastened constraints
