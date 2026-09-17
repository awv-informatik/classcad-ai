# common.clear

Deletes all objects in the current drawing. Callable any time, even on an empty drawing.

## Key Parameters

- No required parameters: `clear()`, `clear({})`, `clear({ keepIds: [] })` are equivalent.
- `keepIds` — optional `Array<id>` of objects to preserve. See [keepIds Behavior](#keepids-behavior).

## Return Value

VOID (null), maxLevel 31, `messages: []`.

## Gotchas

- **IDs reset after full clear** — new objects get the same IDs as before (partId=4, eifId=54). Don't cache IDs across a clear; they collide with new ones.
- **Safe on empty drawing** — clearing twice is a no-op.
- **Re-enables `part.create`**, which otherwise works only once per drawing ("root assembly already exists").

## keepIds Behavior

Preserves database objects — **containers only, not geometry.**

| Object type | Can keep? | Notes |
|---|---|---|
| Part | ✅ | Kept with all expressions and values. Child features (eif, work geometry) deleted unless also in keepIds |
| Entity injection | ✅ | Only with its parent part also kept — otherwise orphaned, unusable |
| Solid (box, cylinder, …) | ❌ | ID accepted silently, but B-rep/mesh deleted — useless shell; solid operations fail (51) |

- **ID counter:** after a keepIds clear, new IDs continue from the highest surviving ID (no reset).
- After `clear({ keepIds: [partId, eifId] })` you can create new solids in the kept eif.
- `common.save` to OFB and STP returns normally (maxLevel 31) after a keepIds clear, but the containers hold no solids — add geometry before exporting anything meaningful.

### keepIds is ATOMIC

If **any** ID in keepIds doesn't exist, **the whole clear aborts** — nothing is deleted: maxLevel 51, code 1006 "An element of parameter keepIds has an invalid id!". The drawing is untouched, so a following `part.create` fails with "root assembly already exists". Recover with `clear({})`. Validate IDs before passing them.

## Common Errors

| Situation | maxLevel | Code | Message |
|---|---|---|---|
| Invalid ID in keepIds | 51 | 1006 | "An element of parameter keepIds has an invalid id!" |
| part.create after aborted clear | 51 | 1200 | "There is already a root assembly or part which must be removed first." |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Keep' })).result
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'W', value: 42 }] })
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })

// Keep part + eif, lose the box
await api.v1.common.clear({ keepIds: [partId, eifId] })
const w = (await api.v1.part.getExpression({ id: partId, name: 'W' })).result
// w.value === 42
await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })  // fresh ID

// Full clear — IDs reset
await api.v1.common.clear({})
const newPartId = (await api.v1.part.create({ name: 'Fresh' })).result
// newPartId === 4
```

## Related

`common.recalc` · `common.save` / `common.load` · `part.create`
