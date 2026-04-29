# assembly.getCylindrical

Retrieves a cylindrical constraint by name from an assembly. Returns the full constraint definition including both mates, offset limits, and rotation limits.

## Prerequisites

- An assembly with at least one cylindrical constraint
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
    flip: string,
    reorient: string,
  },
  zOffsetLimits: {
    min: number | null,  // mm, null = no limit
    max: number | null,
  },
  zRotationLimits: {
    min: number | null,  // radians, null = no limit
    max: number | null,
  },
}
```

**All fields always present.** Default values (flip="Z", reorient="0", zOffsetLimits={min:null, max:null}, zRotationLimits={min:null, max:null}) are explicitly returned — never omitted.

**Does NOT include current position/angle** — only the constraint definition parameters.

On error (maxLevel 51): `null`

## Difference from getRevolute

- **getRevolute** returns: `mate1` + `mate2`, `zOffset` (single number), `zRotationLimits` (min/max)
- **getCylindrical** returns: `mate1` + `mate2`, `zOffsetLimits` (min/max), `zRotationLimits` (min/max)

## Batch Retrieval

Pass array of param objects:

```js
const r = await api.v1.assembly.getCylindrical([
  { id: asmId, name: 'Cyl_A' },
  { id: asmId, name: 'Cyl_B' },
])
// r.result → array of constraint objects (or null for not-found entries)
```

Invalid entries return `null` in their slot. maxLevel reflects the worst case (51 if any entry fails).

## ID Acceptance Rules

| ID type | Works? | Error |
|---|---|---|
| Assembly ID (root or template) | Yes | — |
| Sub-assembly instance ID | Yes | — |
| Part instance ID | No | "The provided product or product reference id is not a Assembly." |
| Constraint ID | No | code 1001, "wrong id type! ["assembly","instance"]" |
| Part template ID | No | code 1001, same |

## Cross-Type Name Collision

**Critical:** get methods find the FIRST constraint by name regardless of type. If a revolute was created before a cylindrical with the same name, `getCylindrical` will find the revolute first, determine it's not a cylindrical, and return null — even though a cylindrical with that name exists.

This is creation-order dependent:
- Cylindrical created first → getCylindrical finds it, getRevolute fails
- Revolute created first → getRevolute finds it, getCylindrical fails

**Best practice:** use unique names across all constraint types on the same assembly.

## Gotchas

- **zRotationLimits always returned as radians**, even if originally created with `'-45deg'`. Values are numeric.
- **zOffsetLimits returned as numbers** (mm).
- **First match wins** when multiple cylindrical constraints share the same name.
- **Type-specific lookup blocked by creation order.** See Cross-Type Name Collision above.
- **After rename via `updateCylindrical`**, the old name returns null.
- **Reflects current state after updates.** Always shows the latest values.

## Common Errors

| Error | Meaning | Code |
|---|---|---|
| `"name" must be provided in the api call!` | Missing name param | 1004 |
| `"id" must be provided in the api call!` | Missing id param | 1004 |
| `There couldn't be found a constraint with name "X" on product...` | No constraint with that name | 0 |
| `The provided product or product reference id is not a Assembly.` | Part instance ID | 0 |
| `"id" has a wrong id type! ["assembly","instance"]` | Constraint/template ID | 1001 |

## Working Example

```js
const cId = (await api.v1.assembly.cylindrical({
  id: asmId, name: 'PistonSlide',
  mate1: { path: [inst1], csys: wcs1, flip: 'Y', reorient: '90' },
  mate2: { path: [inst2], csys: wcs2, flip: '-Z', reorient: '270' },
  zOffsetLimits: { min: -15, max: 25 },
  zRotationLimits: { min: '-45deg', max: '135deg' },
})).result

const g = (await api.v1.assembly.getCylindrical({ id: asmId, name: 'PistonSlide' })).result
// g.id → constraint ID
// g.zOffsetLimits → { min: -15, max: 25 }
// g.zRotationLimits.min → -0.7854 (radians, not '-45deg')
// g.zRotationLimits.max → 2.3562 (radians)
// g.mate1.flip → "Y"
// g.mate2.reorient → "270"
```

## Related

- `assembly.cylindrical` — create the constraint
- `assembly.updateCylindrical` — modify the constraint
- `assembly.deleteConstraint` — delete constraints (use `ids` array, not `id`)
- `assembly.getRevolute` — similar getter for revolute constraints
- `assembly.getFastened` — similar getter for fastened constraints
