# assembly.getFastenedOrigin

Retrieves a fastenedOrigin constraint by name from an assembly. Returns the full constraint state including all mate, offset, and rotation values.

## Prerequisites

- An assembly with at least one fastenedOrigin constraint
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
  xOffset: number,
  yOffset: number,
  zOffset: number,
  xRotation: number,  // always radians
  yRotation: number,
  zRotation: number,
}
```

**All fields always present.** Default values (offsets=0, rotations=0, flip="Z", reorient="0") are explicitly returned — never omitted.

On error (maxLevel 51): `null`

## Batch Retrieval

Pass array of param objects:

```js
const r = await api.v1.assembly.getFastenedOrigin([
  { id: asmId, name: 'FO_A' },
  { id: asmId, name: 'FO_B' },
])
// r.result → array of constraint objects
```

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

- **Rotations always returned as radians**, even if originally created with `'45deg'` string syntax. Values are numeric.
- **First match wins** when multiple constraints share the same name.
- **Name must be exact match** — no partial or case-insensitive lookup.
- **After rename via `updateFastenedOrigin`**, the old name returns null. Only the new name works.
- **`useCurrentTransform` values are stored.** After creating/updating with `useCurrentTransform: 1`, get returns the computed offset/rotation values — not a flag.
- **Negative offsets preserved.** yOffset=-20 is returned as -20.

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
const asmId = (await api.v1.assembly.create({ name: 'MyAsm' })).result

const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
const wcs = (await api.v1.part.workCSys({
  id: tpl, name: 'WCS', origin: [0, 0, 0],
  xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

await api.v1.assembly.setCurrentProduct({ id: asmId })

const inst = (await api.v1.assembly.instance({
  productId: tpl, ownerId: asmId, name: 'Inst1',
})).result

await api.v1.assembly.fastenedOrigin({
  id: asmId, name: 'FO1',
  mate1: { path: [inst], csys: wcs },
  xOffset: 50, zRotation: '45deg',
})

const g = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
// g.id → constraint ID
// g.xOffset → 50
// g.zRotation → 0.785... (radians, not '45deg')
// g.mate1.flip → "Z" (default)
// g.mate1.reorient → "0" (default)
```

## Related

- `assembly.fastenedOrigin` — create the constraint
- `assembly.updateFastenedOrigin` — modify the constraint
- `assembly.getFastened` — retrieve the two-mate variant
