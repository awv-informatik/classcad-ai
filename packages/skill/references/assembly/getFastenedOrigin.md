# assembly.getFastenedOrigin

Queries a fastenedOrigin constraint by name; returns its full state (mate1, offsets, rotations, flip, reorient).

## Key Parameters

- `id` — the assembly holding the constraint: the root, an assembly template, or an instance of a sub-assembly (constraint `G` inside template `Sub` is found via `getFastenedOrigin({ id: subInstance, name: 'G' })`). Part instance IDs fail with "not a Assembly"; part template and constraint IDs are rejected at the type check (1001)
- `name` — constraint name (exact match)

## Return Value

One object, or `null` if not found:

```js
{
  id, name,
  mate1: { csys, flip, path: [instId], reorient },
  xOffset, yOffset, zOffset,        // numbers, 0 if not set
  xRotation, yRotation, zRotation,  // radians, 0 if not set
}
```

All fields are always present: offsets/rotations default to `0`, flip to `"Z"`, reorient to `"0"`. Rotations are always radians (created with `"45deg"` → `0.7853981633974483`).

Array form `getFastenedOrigin([{ id, name: 'FO_A' }, { id, name: 'FO_B' }])` → `[{...}, {...}]`; not-found entries are `null` and `maxLevel` is the worst case (51 if any not found).

## Gotchas

- **Duplicate names return the first-created match**; the second is unreachable by name — use constraint IDs.
- **Reflects updates immediately.** After `updateFastenedOrigin`, queries return the new values; after a rename the old name is gone instantly.
- **`useCurrentTransform` offsets are stored** as regular numbers matching the instance transformation origin.

## Common Errors

| Error | maxLevel | Code | Cause |
|---|---|---|---|
| `couldn't be found a constraint with name "X"` | 51 | 0 | Nonexistent name (`result: null`) |
| `product or product reference id is not a Assembly` | 51 | 0 | Part instance ID passed as `id` |
| `"id" has a wrong id type! [...] ["assembly","instance"]` | 51 | 1001 | Part template or constraint ID passed as `id` |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Mate' })).result
await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Base' })).result
await api.v1.assembly.fastenedOrigin({
  id: asmId, name: 'FO_Base', mate1: { path: [inst], csys: wcs }, xOffset: 50,
})

const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Base' })
// r.result → { id, name, mate1, xOffset: 50, ... }
// Array form: getFastenedOrigin([{ id: asmId, name: 'FO_Base' }, { id: asmId, name: 'Missing' }])
// → result [{ ... }, null], maxLevel 51 (a strict script throws on it)
```

## Related

`assembly.fastenedOrigin` · `assembly.updateFastenedOrigin` · `assembly.getFastened`
