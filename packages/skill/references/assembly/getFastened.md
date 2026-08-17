# assembly.getFastened

Queries a fastened constraint by name. Returns the full constraint state including mates, offsets, rotations, flip, and reorient.

## Prerequisites

- An assembly root (`assembly.create`)
- At least one fastened constraint created via `assembly.fastened`

## Key Parameters

- `id` — assembly root ID. **Only the assembly root works** — passing an instance ID or template ID returns an error despite the docs suggesting they're accepted.
- `name` — the constraint name (string, exact match)

## Return Value

Single call returns one object (or `null` if not found):

```js
{
  id,           // constraint ID (number)
  name,         // constraint name (string)
  mate1: { csys, flip, path: [instId], reorient },
  mate2: { csys, flip, path: [instId], reorient },
  xOffset,      // number (0 if not set)
  yOffset,      // number (0 if not set)
  zOffset,      // number (0 if not set)
  xRotation,    // number in radians (0 if not set)
  yRotation,    // number in radians (0 if not set)
  zRotation,    // number in radians (0 if not set)
}
```

**All fields always present.** Offsets/rotations default to `0`. Flip defaults to `"Z"`. Reorient defaults to `"0"`. Nothing is omitted.

**Rotations are always radians.** Even if you created with `"90deg"`, the result returns `1.5707963267948966`.

## Array Form

Pass an array to batch-query:

```js
const r = await api.v1.assembly.getFastened([
  { id: asmId, name: 'F1' },
  { id: asmId, name: 'F2' },
])
// r.result → [{...F1}, {...F2}]
```

Not-found entries are `null` within the array. `maxLevel` reflects the worst case (51 if any entry not found).

## Gotchas

- **Instance ID does NOT work as `id`.** Docs say "id of the assembly or instance" but the server rejects non-assembly IDs with `"The provided product or product reference id is not a Assembly."` (error level 51). Always pass the assembly root ID.
- **Duplicate names return first match.** If two constraints share the same name, `getFastened` returns the one created first. The second constraint is unreachable by name — use constraint IDs instead.
- **Reflects updates immediately.** After `updateFastened`, a `getFastened` query returns the updated values. After a rename via `updateFastened`, the old name is gone — query by the new name.
- **`useCurrentTransform` offsets are stored.** When a constraint was created with `useCurrentTransform: 1`, the back-computed offsets appear in the result as regular offset values.

## Common Errors

| Error | maxLevel | Cause |
|---|---|---|
| `couldn't be found a constraint with name "X"` | 51 | Non-existent constraint name |
| `product or product reference id is not a Assembly` | 51 | Passed instance/template ID instead of assembly root |

Non-existent name: `result: null`, maxLevel=51, error code=0.

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
// ... setup template, instances, fastened constraint named "Joint" ...

// Single query
const r = await api.v1.assembly.getFastened({ id: asmId, name: 'Joint' })
// r.result → { id, name, mate1, mate2, xOffset, yOffset, zOffset, ... }

// Batch query
const batch = await api.v1.assembly.getFastened([
  { id: asmId, name: 'Joint' },
  { id: asmId, name: 'Other' },
])
// batch.result → [{ ... }, { ... }]

// Check for not-found
if (r.result === null) console.log('Constraint not found')
```

## Related

- `assembly.fastened` — create a fastened constraint
- `assembly.updateFastened` — modify constraint params
- `assembly.getFastenedOrigin` — query fastenedOrigin constraints (same pattern, different type)
