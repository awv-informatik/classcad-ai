# common.getUserDataKeys

Returns all keys of an object's user data map as `string[]`. CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`.

## Key Parameters

- `id` — target object ID. Required. Works on every object type (part, entity injection, sketch, work plane, …). Read-only; no other parameters.

## Return Value

- Success: `Array<string>`, maxLevel 31, `messages: []`.
- No keys: `[]` (not null), maxLevel 31.
- Error: `null`, maxLevel 51.

## Gotchas

- **Hash map order.** Neither insertion nor lexicographic order, and not predictable.
- **Per-object.** A part's keys don't include keys of its children (entity injections, sketches, work planes).
- **Session-only.** After OFB save/load, returns `[]`.
- **Key existence:** `keys.includes('myKey')` is the only reliable check — `getUserData` returns `""` for both missing keys and empty values. Count with `keys.length`.
- Any string is a valid key (empty, unicode, special characters, spaces, tabs, newlines, 200+ chars) and is preserved exactly. 20+ keys work; no limit observed.

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| null, maxLevel 51, code 1004 | Missing `id` | Always pass `id` |
| null, maxLevel 51, code 1006 | Invalid, zero, or nonexistent ID | Verify object exists |
| null, maxLevel 51, code 1001 | VOID/null ID (e.g. result of a failed call) | Use an API that returns an ID |
| null, maxLevel 51, code 0 + 1006 | String ID (not numeric) | IDs are numeric |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.setUserData({ id: partId, key: 'version', value: '2' })

const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
// → ["version", "material"] (order not guaranteed)

// Enumerate all metadata
const metadata = {}
for (const key of keys) {
  metadata[key] = (await api.v1.common.getUserData({ id: partId, key })).result
}
// → { version: "2", material: "steel" }
```

## Related

`common.setUserData` · `common.getUserData` · `common.removeUserData` · `common.clearUserData`
