# common.setUserData / getUserData / removeUserData / clearUserData / getUserDataKeys

String key-value metadata store on any object. Useful for tagging objects with application-specific metadata during a session. **Session-scoped only** — not persisted on save/load.

## Prerequisites

- Any valid object ID (part, entity injection, solid, sketch, individual sketch geometry element)

## Key Parameters

### setUserData
- `id` — any object ID
- `key` — **must be string**. Case-sensitive. Supports unicode, spaces, special characters, empty string.
- `value` — **must be string**. No length limit observed (100K+ chars works). Empty string is valid.

### getUserData
- `id`, `key` — same as above
- `defaultValue` — optional string, defaults to `""`. Returned when key doesn't exist.

### removeUserData / clearUserData / getUserDataKeys
- `id` — the target object
- `key` (removeUserData only) — the key to remove

## Gotchas

### setUserData does NOT overwrite existing keys
This is the #1 gotcha. Calling `setUserData` on a key that already exists is a **silent no-op** — maxLevel 31, no error messages, but the value does not change. To update a value:

```js
await api.v1.common.removeUserData({ id, key: 'myKey' })
await api.v1.common.setUserData({ id, key: 'myKey', value: 'newValue' })
```

### Not persisted on save/load
User data does NOT survive OFB save/load cycles. After `common.save` → `common.clear` → `common.load`, all user data is gone. User data is session-scoped metadata only.

### Not copied on duplication
`solid.copy` does not copy user data from the source to the copy. The copy starts with an empty user data map.

### Non-string types are rejected
- Number, boolean, object, array → error code 1001: `"The parameter \"value\" has the wrong type! It should be of type (string)"`
- Null → `"Set the parameter \"value\" = VOID is not allowed in this situation!"`
- Keys must also be strings — numeric keys get the same error 1001.

## Common Patterns

### Storing structured data (JSON workaround)
```js
const data = { material: 'steel', weight: 42.5, tags: ['structural'] }
await api.v1.common.setUserData({ id, key: 'metadata', value: JSON.stringify(data) })
const retrieved = JSON.parse(
  (await api.v1.common.getUserData({ id, key: 'metadata' })).result
)
```

### Updating a value (remove-then-set)
```js
await api.v1.common.removeUserData({ id, key: 'status' })
await api.v1.common.setUserData({ id, key: 'status', value: 'updated' })
```

## Safe Operations

All "missing data" operations are safe no-ops (maxLevel 31, no error):
- `getUserData` on non-existent key → returns `defaultValue` (or `""`)
- `removeUserData` on non-existent key → no-op
- `clearUserData` on object with no data → no-op
- `getUserDataKeys` on object with no data → `[]`

## Behavior During Operations

User data **survives** all in-session operations:
- `common.recalc` — intact
- `common.setObjectName` (rename) — intact
- `part.updateExpression` — intact
- Adding/modifying other objects in the same part — intact

User data is **lost** when:
- The object is deleted
- The drawing is saved and reloaded
- The object is copied (`solid.copy`)

## Limits

No practical limits found:
- **Value length**: 100K+ characters works
- **Key length**: 1000+ characters works
- **Key count per object**: 500+ keys works
- **Key format**: Unicode, whitespace, special characters all accepted. Empty string is a valid key.
- **Case sensitivity**: Keys are case-sensitive. `"Key"`, `"key"`, `"KEY"` are separate entries.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

// Set
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.setUserData({ id: partId, key: 'version', value: '2' })

// Get
const mat = (await api.v1.common.getUserData({ id: partId, key: 'material' })).result
// → "steel"

// List keys
const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
// → ["material", "version"]

// Update (remove-then-set!)
await api.v1.common.removeUserData({ id: partId, key: 'version' })
await api.v1.common.setUserData({ id: partId, key: 'version', value: '3' })

// Clear all
await api.v1.common.clearUserData({ id: partId })
```

## Related

- `common.setObjectName` / `common.getObjectName` — built-in name property (not user data)
- `common.save` / `common.load` — user data is lost during save/load
- `solid.copy` — user data is not copied
