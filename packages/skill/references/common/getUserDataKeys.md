# common.getUserDataKeys

Returns all keys from an object's user data map as an array of strings. Part of the five-method CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`.

## Prerequisites

- Any object with a valid ID (part, entity injection, sketch, work plane — anything that returns an ID from a creation API)

## Key Parameters

- `id` — target object ID. Required. Works on every object type that has an ID.

No other parameters. This is a read-only query.

## Return Value

- **Success:** `result: Array<string>` — the keys. `maxLevel: 31`, `messages: []`.
- **Empty:** `result: []` — empty array when no keys exist. Still `maxLevel: 31`. Not null.
- **Error:** `result: null` — null on any error. `maxLevel: 51`.

## Gotchas

- **Order is hash map order.** Keys are NOT returned in insertion order or lexicographic order. The order is determined by the internal hash map and is not predictable. Do not rely on any specific ordering.
- **Per-object isolation.** Keys on a parent object (part) do not include keys from child objects (entity injections, sketches, work planes). Each object's user data is fully independent.
- **Cannot query VOID objects.** Some APIs (e.g., `solid.box`) return VOID instead of an ID. Passing null/VOID gives error code 1001.
- **User data is session-only.** Not persisted across OFB save/load. After reloading, `getUserDataKeys` returns `[]`.

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| `result: null`, maxLevel 51, code 1004 | Missing `id` parameter | Always pass `id` |
| `result: null`, maxLevel 51, code 1006 | Invalid, zero, or nonexistent ID | Verify object exists |
| `result: null`, maxLevel 51, code 1001 | VOID/null ID | Use an API that returns an actual ID |
| `result: null`, maxLevel 51, code 0 + 1006 | String ID (not numeric) | IDs are numeric |

## Usage Hints

- **Enumerate all metadata:** iterate `getUserDataKeys` result with `getUserData` to build a full key-value map
- **Check key existence:** `keys.includes('myKey')` is the only reliable way — `getUserData` returns `""` for both missing keys and keys with empty values
- **Count keys:** `keys.length` — no separate count API
- **All string content is valid as a key:** empty strings, unicode, special characters, spaces, tabs, newlines, 200+ char keys — all preserved exactly
- **At least 20 keys** work without issues. No observed limit.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

// Set metadata
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.setUserData({ id: partId, key: 'version', value: '2' })

// List all keys
const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
// → ["version", "material"] (order not guaranteed)

// Enumerate all metadata
const metadata = {}
for (const key of keys) {
  metadata[key] = (await api.v1.common.getUserData({ id: partId, key })).result
}
// → { version: "2", material: "steel" }

// Check if a key exists
const hasMaterial = keys.includes('material') // → true
```

## Related

- `common.setUserData` — write a key-value pair (silent no-op if key exists)
- `common.getUserData` — read a value by key
- `common.removeUserData` — delete a single key
- `common.clearUserData` — delete all keys from an object
