# common.clear

Deletes all objects in the current drawing. Resets the drawing to an empty state.

## Prerequisites

None — can be called at any time, even on an empty drawing.

## Key Parameters

- **No required parameters.** `clear()`, `clear({})`, and `clear({ keepIds: [] })` are all equivalent.
- `keepIds` — optional `Array<id>`. IDs of objects to preserve during clear. See [keepIds Behavior](#keepids-behavior) below.

## Return Value

Returns VOID (null). maxLevel=31 (info). Empty messages array.

## Basic Usage

```js
// Full clear — delete everything
await api.v1.common.clear({})

// Equivalent:
await api.v1.common.clear()
await api.v1.common.clear({ keepIds: [] })
```

After clear, the drawing is empty. `part.create` works and returns fresh IDs starting from the same initial values (partId=4 in a typical session).

## Gotchas

- **IDs reset after full clear.** New objects get the same IDs as before clear (e.g., partId=4, eifId=54). Don't cache old IDs across a clear boundary — they'll collide with new IDs.
- **Safe on empty drawing.** Clearing an already-empty drawing is a no-op (no error). Double clear is safe.
- **`part.create` only works once per drawing.** After clear, you can call `part.create` again — clear removes the "root assembly already exists" restriction.

## keepIds Behavior

`keepIds` preserves specified database objects during clear. **Containers only — not geometry.**

### What can be kept

| Object type | Can keep? | Notes |
|---|---|---|
| Part (partId) | ✅ | Preserved, including expressions. Child features (eif, work geometry) are deleted unless also in keepIds |
| Entity injection (eifId) | ✅ | Only if parent part also in keepIds. Without parent → orphaned, unusable |
| Solid (boxId, cylId, etc.) | ❌ | ID accepted silently, but internal geometry (B-rep, mesh) is deleted. Solid operations fail with maxLevel=51 |

### keepIds rules

1. **Keep the full container hierarchy.** To reuse an entity injection after clear, keep both `[partId, eifId]`. Keeping just eifId without partId creates an orphan.
2. **Solids cannot be preserved.** Even if included in keepIds, solid IDs become useless shells. Their internal geometry references are invalidated.
3. **Expressions survive.** When keeping a part, all its expressions are preserved with their values.
4. **ID counter behavior.** After keepIds clear, new IDs continue from the highest surviving ID (not reset). After full clear, IDs reset to initial values.
5. **Create new features in kept containers.** After `clear({ keepIds: [partId, eifId] })`, you can create new solids in the kept eifId.

### keepIds is ATOMIC

If **any** ID in keepIds is invalid (nonexistent), the **entire clear operation aborts**. Nothing is deleted.

```js
// This ABORTS — 999999 doesn't exist
await api.v1.common.clear({ keepIds: [partId, 999999] })
// maxLevel=51, code=1006: "An element of parameter keepIds has an invalid id!"
// Drawing is UNTOUCHED — part.create will fail with "root assembly already exists"

// Recovery: call clear without keepIds
await api.v1.common.clear({})
```

**Always validate IDs before passing them to keepIds.** A single bad ID prevents the entire clear.

### STEP/OFB export hazard after keepIds

After `clear({ keepIds: [...] })`, exporting to STEP/OFB via `common.save` may hang the server on the partially-cleared state. **`recalc` and mesh rendering work fine.** The hang only occurs during geometry export.

**Workaround:** Create new valid geometry before exporting. Once new features are added to the kept containers, export works normally.

## Working Example

```js
// Full clear + recreate
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })

await api.v1.common.clear({})
// Drawing is empty, IDs reset

const newPartId = (await api.v1.part.create({ name: 'Fresh' })).result
// newPartId === 4 (same as before clear)
```

```js
// Selective clear with keepIds
const partId = (await api.v1.part.create({ name: 'Keep' })).result
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'W', value: 42 }] })
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })

// Keep part + eif, lose the box
await api.v1.common.clear({ keepIds: [partId, eifId] })

// Expression survives
const w = (await api.v1.part.getExpression({ id: partId, name: 'W' })).result
// w.value === 42

// Can create new geometry in the kept eif
const newBoxId = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30 })).result
// Works — newBoxId is a fresh ID continuing from the surviving IDs
```

## Common Errors

| Situation | maxLevel | Code | Message |
|---|---|---|---|
| Invalid ID in keepIds | 51 | 1006 | "An element of parameter keepIds has an invalid id!" |
| part.create after aborted clear | 51 | 1200 | "There is already a root assembly or part which must be removed first." |

## Related

- `common.recalc` — safe to call after any clear variant
- `common.save` / `common.load` — save before clear to preserve state; clear after load to start fresh
- `part.create` — works after clear; aborted clear (invalid keepIds) blocks it until recovery clear
