# common.clearUserData

Removes all user data entries from an object in one call. CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`.

## Key Parameters

- `id` — target object ID. Required. Works on every object type (part, entity injection, work plane, sketch, sketch curve, solid). No other parameters.

## Return Value

`result: null` (VOID) on success and failure. maxLevel 31 + `messages: []` on success, 51 on error.

## Gotchas

- **Idempotent.** Clearing an object with no user data (or clearing twice) is a silent no-op, maxLevel 31.
- **Per-object only.** Clearing a part does not cascade to children (entity injections, sketches, …).
- **Enables re-set.** After clearing, the same keys can be set again — unlike `setUserData` on an existing key (silent no-op). This is the "wipe and start fresh" mechanism; use it with `setUserData` for bulk updates instead of `removeUserData` per key.
- **Session-only.** User data is not persisted across OFB save/load.
- **Scale:** 50+ keys cleared in one call without issues; no limit observed.
- **Never pass negative IDs.** `setUserData` with `id: -1` crashes the worker; treat all user data APIs the same.

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| maxLevel 51, code 1006 | Invalid or zero ID | Verify object ID exists |
| maxLevel 51, code 1006 + warning | Nonexistent ID (e.g. 9999) | Use a valid, existing ID |
| maxLevel 51, code 1004 | Missing `id` | Always pass `id` |
| Worker crash | Negative ID | Never use negative IDs |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.setUserData({ id: partId, key: 'color', value: 'blue' })

await api.v1.common.clearUserData({ id: partId })

// Keys are gone — can re-set immediately
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'aluminum' })
const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
// → ["material"]
```

## Related

`common.setUserData` · `common.getUserData` · `common.removeUserData` · `common.getUserDataKeys`
