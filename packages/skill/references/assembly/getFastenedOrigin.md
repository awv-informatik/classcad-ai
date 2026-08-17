# assembly.getFastenedOrigin

Queries a fastenedOrigin constraint by name. Returns the full constraint state including mate1, offsets, rotations, flip, and reorient.

## Prerequisites

- An assembly root (`assembly.create`)
- At least one fastenedOrigin constraint created via `assembly.fastenedOrigin`

## Key Parameters

- `id` — assembly root ID. **Only the assembly root works** — instance IDs pass the type check but fail at runtime with "not a Assembly". Template and constraint IDs are rejected at the type-check level.
- `name` — the constraint name (string, exact match)

## Return Value

Single call returns one object (or `null` if not found):

```js
{
  id,           // constraint ID (number)
  name,         // constraint name (string)
  mate1: { csys, flip, path: [instId], reorient },
  xOffset,      // number (0 if not set)
  yOffset,      // number (0 if not set)
  zOffset,      // number (0 if not set)
  xRotation,    // number in radians (0 if not set)
  yRotation,    // number in radians (0 if not set)
  zRotation,    // number in radians (0 if not set)
}
```

**All fields always present.** Offsets/rotations default to `0`. Flip defaults to `"Z"`. Reorient defaults to `"0"`. Nothing is omitted.

**Rotations are always radians.** Even if you created with `"45deg"`, the result returns `0.7853981633974483`.

## Array Form

Pass an array to batch-query:

```js
const r = await api.v1.assembly.getFastenedOrigin([
  { id: asmId, name: 'FO_A' },
  { id: asmId, name: 'FO_B' },
])
// r.result → [{...FO_A}, {...FO_B}]
```

Not-found entries are `null` within the array. `maxLevel` reflects the worst case (51 if any entry not found).

## Gotchas

- **Instance ID does NOT work as `id`.** The type-check schema claims `["assembly","instance"]` are valid, but instance IDs fail at a second validation: "The provided product or product reference id is not a Assembly." (code 0). Always pass the assembly root ID.
- **Duplicate names return first match.** If two constraints share the same name, `getFastenedOrigin` returns the one created first. The second is unreachable by name — use constraint IDs instead.
- **Reflects updates immediately.** After `updateFastenedOrigin`, a query returns updated values with no delay. After a rename, the old name is gone instantly — query by the new name.
- **`useCurrentTransform` offsets are stored.** When a constraint was created with `useCurrentTransform: 1`, the back-computed offsets appear as regular numbers matching the instance transformation origin.

## Common Errors

| Error | maxLevel | Code | Cause |
|---|---|---|---|
| `couldn't be found a constraint with name "X"` | 51 | 0 | Nonexistent constraint name |
| `product or product reference id is not a Assembly` | 51 | 0 | Instance ID passed as `id` |
| `"id" has a wrong id type! [...] ["assembly","instance"]` | 51 | 1001 | Template or constraint ID passed as `id` |

Nonexistent name: `result: null`, maxLevel=51, code=0.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
// ... setup template, instances, fastenedOrigin constraint named "FO_Base" ...

// Single query
const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Base' })
// r.result → { id, name, mate1, xOffset, yOffset, zOffset, ... }

// Batch query
const batch = await api.v1.assembly.getFastenedOrigin([
  { id: asmId, name: 'FO_Base' },
  { id: asmId, name: 'FO_Other' },
])
// batch.result → [{ ... }, { ... }]

// Check for not-found
if (r.result === null) console.log('Constraint not found')
```

## Related

- `assembly.fastenedOrigin` — create a fastenedOrigin constraint
- `assembly.updateFastenedOrigin` — modify constraint params
- `assembly.getFastened` — query fastened constraints (same pattern, different constraint type)
