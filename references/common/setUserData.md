# common.setUserData

Attaches a string key-value pair to any ClassCAD object. Part of a five-method CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`.

## Prerequisites

- Any object with an ID (part, entity injection, work plane, work axis, sketch, sketch curve, solid, box feature, extrusion feature — anything)

## Key Parameters

- `id` — target object. Works on every object type, not just parts.
- `key` — string. Case-sensitive (`"Material"` ≠ `"material"`). Empty strings, unicode, special chars, 500+ char keys all work.
- `value` — **must be a string**. Non-string values (numbers, booleans, null, arrays, objects) are rejected with `maxLevel: 51`. Use `String()` or `JSON.stringify()` to store non-string data.

## Return Value

Returns `result: null` (VOID) with `maxLevel: 31` on success. No useful return value.

## Gotchas

- **Overwrite is a silent no-op.** Calling `setUserData` on a key that already exists does nothing — no error, no warning, `maxLevel: 31`. The value stays unchanged. To update a value, you must `removeUserData` first, then `setUserData` again.
- **Not persisted across save/load.** User data is session-only. Saving to OFB and reloading loses all user data. Not documented in the API reference.
- **Not copied on duplication.** If the object is copied (e.g., `solid.copy`), the copy has no user data. Documented.
- **Never pass negative IDs.** `id: -1` hangs the server at 100% CPU. IDs 0 and 9999 (nonexistent) produce proper errors (`maxLevel: 51`).
- **Key ordering is undefined.** `getUserDataKeys` does not return keys in insertion order — it's hash map order.

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| `maxLevel: 51`, value not set | Non-string value passed | Wrap with `String()` or `JSON.stringify()` |
| `maxLevel: 51`, "invalid id" | Nonexistent or zero ID | Verify the object ID exists |
| Value unchanged after set | Key already exists (silent no-op) | Call `removeUserData` first, then `setUserData` |
| Data missing after load | User data not persisted in OFB | Re-set after loading |
| Server hang | Negative ID passed | Never use negative IDs |

## Usage Hints

- To update a value: `removeUserData({ id, key })` → `setUserData({ id, key, value: newValue })`
- To store non-strings: `setUserData({ id, key, value: JSON.stringify(obj) })`, retrieve with `JSON.parse(getUserData(...).result)`
- `getUserData` returns `""` by default when a key doesn't exist. Set `defaultValue` to detect missing keys: `getUserData({ id, key, defaultValue: '__MISSING__' })`
- `removeUserData` on a nonexistent key is a silent no-op (safe to call without checking)
- `clearUserData` on an object with no data is a silent no-op

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

// Set metadata
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.setUserData({ id: partId, key: 'config', value: JSON.stringify({ grade: 'A36' }) })

// Read back
const mat = (await api.v1.common.getUserData({ id: partId, key: 'material' })).result
// → "steel"

// Update (must remove first!)
await api.v1.common.removeUserData({ id: partId, key: 'material' })
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'aluminum' })

// List all keys
const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
// → ["config", "material"] (order not guaranteed)

// Clean up
await api.v1.common.clearUserData({ id: partId })
```

## Related

- `common.getUserData` — read a value by key
- `common.removeUserData` — remove a single key
- `common.clearUserData` — remove all keys from an object
- `common.getUserDataKeys` — list all keys on an object
