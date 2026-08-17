# common.getUserData

Reads a string value from an object's user data map by key. Returns the value if the key exists, or a default value if it doesn't. Part of the five-method CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`.

## Prerequisites

- Any object with a valid ID (part, entity injection, work plane, sketch, solid — anything)
- The key does NOT need to exist — missing keys return a default, not an error

## Key Parameters

- `id` — target object ID. Works on every object type.
- `key` — string, case-sensitive. Required — omitting it causes error code 1004.
- `defaultValue` — **must be a string**. Returned when the key doesn't exist. Defaults to `""` if omitted. Passing a non-string type (number, boolean, null) causes `maxLevel: 51` — a full error, not type coercion.

## Return Value

- `result` — string. The stored value, or the defaultValue if key is missing.
- `maxLevel` — 31 on success (even when using default). 51 on error (bad ID, missing key param, non-string defaultValue).

## Gotchas

- **Missing key is not an error.** Reading a key that was never set returns `""` (or defaultValue) with `maxLevel: 31`. No warning, no error. You cannot distinguish "key exists with empty value" from "key never set" without checking `getUserDataKeys` first.
- **defaultValue must be a string.** Passing `defaultValue: 42` or `defaultValue: true` or `defaultValue: null` causes `maxLevel: 51`. Always use a string.
- **User data is session-only.** Not persisted across OFB save/load. After reloading a file, all user data is gone.
- **User data is not copied on duplication.** `solid.copy` and similar operations do not carry user data to the copy.
- **Overwrite trap.** If you set a key, then set it again with a new value (without removing first), the value does NOT change — `setUserData` silently ignores duplicate keys. To update: `removeUserData` → `setUserData`.
- **id=0 and nonexistent IDs** produce `maxLevel: 51`, error code 1006. Negative IDs may hang the server.

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| `maxLevel: 51`, result=null | Nonexistent or zero ID | Verify object ID exists |
| `maxLevel: 51`, code 1004 | Missing `key` parameter | Always pass `key` |
| `maxLevel: 51` when using defaultValue | Non-string defaultValue (number, bool, null) | Use string: `defaultValue: '42'` not `defaultValue: 42` |
| Returns `""` unexpectedly | Key never set, no defaultValue specified | Set a sentinel defaultValue to detect: `defaultValue: '__MISSING__'` |
| Returns old value after "update" | setUserData overwrite is a no-op | Use `removeUserData` then `setUserData` |
| Returns `""` after file reload | User data not persisted in OFB | Re-set user data after loading |

## Usage Hints

- To detect whether a key exists: `getUserData({ id, key, defaultValue: '__MISSING__' })` — if result is `'__MISSING__'`, the key was never set
- To store non-strings: `setUserData({ id, key, value: JSON.stringify(obj) })` then `JSON.parse(getUserData({ id, key }).result)`
- Keys support any string content: empty strings, unicode, emoji, special characters, 500+ char keys, embedded newlines
- Values up to at least 50KB work without truncation
- User data is isolated per object — same key on different objects stores independent values

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

// Set some metadata
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })

// Read it back
const val = (await api.v1.common.getUserData({ id: partId, key: 'material' })).result
// → "steel"

// Read with defaultValue for missing key
const missing = (await api.v1.common.getUserData({
  id: partId,
  key: 'color',
  defaultValue: 'unset'
})).result
// → "unset"

// Read missing key without defaultValue
const empty = (await api.v1.common.getUserData({ id: partId, key: 'color' })).result
// → "" (empty string, not an error)
```

## Related

- `common.setUserData` — write a key-value pair (silent no-op if key exists)
- `common.removeUserData` — delete a single key (required before re-setting)
- `common.clearUserData` — delete all keys from an object
- `common.getUserDataKeys` — list all keys (hash map order, not predictable)
