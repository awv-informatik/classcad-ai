# common.removeUserData

Removes a single user data entry by key from an object. Part of the five-method CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`.

## Prerequisites

- Any object with a valid ID (part, entity injection, work plane, sketch — anything that returns an ID)

## Key Parameters

- `id` — target object ID. Required. Must be a valid, existing ID — not null, not zero, not a string.
- `key` — string, case-sensitive. Required — omitting it causes error code 1004. Empty string `""` is a valid key (removes the entry keyed by empty string, not an error).

## Return Value

- `result: null` (VOID) — always null, on both success and failure.
- `maxLevel: 31` on success. `maxLevel: 51` on error.
- `messages: []` on success (empty array).

## Gotchas

- **Idempotent.** Removing a key that doesn't exist is a silent no-op — `maxLevel: 31`, no error, no warning. Safe to call without checking existence first. Double-removing is also fine.
- **Required for updates.** `setUserData` is a no-op on existing keys. To change a value: `removeUserData({ id, key })` → `setUserData({ id, key, value: newValue })`.
- **Per-object isolation.** Removing a key from one object does not affect the same key on any other object.
- **VOID IDs fail.** Some APIs (e.g., `solid.box`) return VOID instead of an ID. Passing null/VOID as `id` gives error code 1001.

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| `maxLevel: 51`, code 1004 | Missing `key` parameter | Always pass `key` |
| `maxLevel: 51`, code 1006 | Invalid or zero ID | Verify object ID exists |
| `maxLevel: 51`, code 1001 | `id` is null/VOID | The creation API returned VOID — use an API that returns an ID |
| `maxLevel: 51`, code 0 + 1006 | String ID (not a number) | IDs are numeric — don't pass string identifiers |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

// Set then remove
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.removeUserData({ id: partId, key: 'material' })

// Key is now gone
const val = (await api.v1.common.getUserData({
  id: partId, key: 'material', defaultValue: '__GONE__'
})).result
// → "__GONE__"

// Update pattern: remove then re-set
await api.v1.common.setUserData({ id: partId, key: 'version', value: 'v1' })
await api.v1.common.removeUserData({ id: partId, key: 'version' })
await api.v1.common.setUserData({ id: partId, key: 'version', value: 'v2' })
// value is now "v2"
```

## Related

- `common.setUserData` — write a key-value pair (no-op if key exists — must remove first to update)
- `common.getUserData` — read a value by key
- `common.clearUserData` — remove ALL keys from an object
- `common.getUserDataKeys` — list all keys on an object
