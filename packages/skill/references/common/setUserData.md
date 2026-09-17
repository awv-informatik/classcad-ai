# common.setUserData

Attaches a string key-value pair to any object. CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`. Overview of the set: `userData.md`.

## Key Parameters

- `id` — any object (part, entity injection, work plane/axis, sketch, sketch curve, solid, box/extrusion feature, …).
- `key` — string, case-sensitive (`"Material"` ≠ `"material"`). Empty, unicode, special chars, 500+ chars all work.
- `value` — **must be a string**. Numbers, booleans, null, arrays, objects → maxLevel 51. Use `String()` / `JSON.stringify()` (read back with `JSON.parse`).

## Return Value

`result: null` (VOID), maxLevel 31 on success.

## Gotchas

- **Overwrite is a silent no-op.** Setting an existing key does nothing (maxLevel 31, no warning). Update with `removeUserData` then `setUserData`.
- **Not persisted across save/load** (session-only; undocumented).
- **Not copied on duplication** (`solid.copy`; documented).
- **Never pass negative IDs.** `id: -1` crashes the ClassCAD worker (process exits). ID 0 and nonexistent IDs (9999) give proper errors (maxLevel 51).
- **Key order** from `getUserDataKeys` is hash map order, not insertion order.
- `getUserData` returns `""` for missing keys; pass `defaultValue: '__MISSING__'` to detect them. `removeUserData` on a missing key and `clearUserData` on an empty object are silent no-ops.

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| maxLevel 51, value not set | Non-string value | `String()` or `JSON.stringify()` |
| maxLevel 51, "invalid id" | Nonexistent or zero ID | Verify the ID exists |
| Value unchanged after set | Key already exists | `removeUserData` first |
| Data missing after load | Not persisted in OFB | Re-set after loading |
| Worker crash | Negative ID | Never use negative IDs |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.setUserData({ id: partId, key: 'config', value: JSON.stringify({ grade: 'A36' }) })

// Update (must remove first!)
await api.v1.common.removeUserData({ id: partId, key: 'material' })
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'aluminum' })

const mat = (await api.v1.common.getUserData({ id: partId, key: 'material' })).result
// → "aluminum"
```

## Related

`common.getUserData` · `common.removeUserData` · `common.clearUserData` · `common.getUserDataKeys`
