# assembly.getFastened

Queries a fastened constraint by name; returns its full state (mates, offsets, rotations, flip, reorient).

## Key Parameters

- `id` — the assembly holding the constraint: the root, an assembly template, or an instance of a sub-assembly (constraint `J` inside template `Sub` is found via `getFastened({ id: subInstance, name: 'J' })`). **Part instance IDs fail:** `"The provided product or product reference id is not a Assembly."` (level 51)
- `name` — constraint name (exact match)

## Return Value

One object, or `null` if not found:

```js
{
  id, name,
  mate1: { csys, flip, path: [instId], reorient },
  mate2: { csys, flip, path: [instId], reorient },
  xOffset, yOffset, zOffset,        // numbers, 0 if not set
  xRotation, yRotation, zRotation,  // radians, 0 if not set
}
```

All fields are always present: offsets/rotations default to `0`, flip to `"Z"`, reorient to `"0"`. Rotations are always radians (created with `"90deg"` → `1.5707963267948966`).

Array form `getFastened([{ id, name: 'F1' }, { id, name: 'F2' }])` → `[{...}, {...}]`; not-found entries are `null` and `maxLevel` is the worst case (51 if any not found).

## Gotchas

- **Duplicate names return the first-created match**; the second is unreachable by name — use constraint IDs.
- **Reflects updates immediately.** After `updateFastened`, queries return the new values; after a rename the old name is gone.
- **`useCurrentTransform` offsets are stored** as regular offset values.

## Common Errors

| Error | maxLevel | Cause |
|---|---|---|
| `couldn't be found a constraint with name "X"` | 51 | Non-existent name (`result: null`, error code 0) |
| `product or product reference id is not a Assembly` | 51 | Part instance ID instead of an assembly (see `id` above for what works) |
| `has a wrong id type! ... ["assembly","instance"]` | 51 | Part template ID (code 1001) |

## Working Example

```js
const asmId = (await api.v1.assembly.create({})).result
const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
const wcs = (await api.v1.part.workCSys({ id: tpl, name: 'Mate' })).result
await api.v1.assembly.setCurrentProduct({ id: asmId })
const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'B' })).result
await api.v1.assembly.fastened({
  id: asmId, name: 'Joint',
  mate1: { path: [inst1], csys: wcs }, mate2: { path: [inst2], csys: wcs }, xOffset: 50,
})

const r = await api.v1.assembly.getFastened({ id: asmId, name: 'Joint' })
// r.result → { id, name, mate1, mate2, xOffset: 50, ... }
// Array form: getFastened([{ id: asmId, name: 'Joint' }, { id: asmId, name: 'Missing' }])
// → result [{ ... }, null], maxLevel 51 (a strict script throws on it)
```

## Related

`assembly.fastened` · `assembly.updateFastened` · `assembly.getFastenedOrigin`
