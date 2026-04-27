# assembly.getFastened

Retrieves a fastened constraint by name from an assembly. Returns the full constraint state including all mate, offset, and rotation values.

## Prerequisites

- An assembly with at least one fastened constraint
- The constraint name

## Key Parameters

- `id` (required) — the **assembly ID** (not a constraint or instance ID). Passing an instance ID errors: "The provided product or product reference id is not a Assembly."
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
  mate2: { ... },     // same structure as mate1
  xOffset: number,
  yOffset: number,
  zOffset: number,
  xRotation: number,  // always radians
  yRotation: number,
  zRotation: number,
}
```

On error (maxLevel 51): `null`

## Gotchas

- **Requires assembly ID, not instance ID.** Instance ID → error: "The provided product or product reference id is not a Assembly."
- **Rotations always returned as radians**, even if originally set with `'45deg'` string syntax.
- **First match wins** when multiple constraints share the same name.
- **Name must be exact match** — no partial matching or case-insensitive lookup.

## Common Errors

| Error | Meaning |
|---|---|
| `There couldn't be found a constraint with name "X" on product or product reference with id $N` | No constraint with that name |
| `The provided product or product reference id is not a Assembly.` | Instance/part ID instead of assembly ID |

## Working Example

```js
const g = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
// g.id → 212 (constraint ID)
// g.xOffset → 50
// g.mate1.flip → "Z"
// g.zRotation → 0.785 (PI/4, stored as radians)
```

## Related

- `assembly.fastened` — create constraints
- `assembly.updateFastened` — modify constraints
- `assembly.getFastenedOrigin` — retrieve fastenedOrigin constraints
