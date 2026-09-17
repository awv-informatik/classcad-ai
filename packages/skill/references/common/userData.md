# common.setUserData / getUserData / removeUserData / clearUserData / getUserDataKeys

String key-value metadata on any object (part, entity injection, solid, sketch, individual sketch geometry element). **Session-scoped only** — not persisted on save/load.

## Key Parameters

| Method | Params |
|---|---|
| `setUserData` | `id`; `key` — **string**, case-sensitive, unicode/spaces/special chars/empty OK; `value` — **string**, empty OK, 100K+ chars work |
| `getUserData` | `id`, `key`; `defaultValue` — optional string (default `""`), returned for missing keys |
| `removeUserData` | `id`, `key` |
| `clearUserData` / `getUserDataKeys` | `id` |

## Gotchas

- **`setUserData` does NOT overwrite existing keys** — silent no-op (maxLevel 31, no messages, value unchanged). Update with remove-then-set:
  ```js
  await api.v1.common.removeUserData({ id, key: 'myKey' })
  await api.v1.common.setUserData({ id, key: 'myKey', value: 'newValue' })
  ```
- **Non-string types rejected:**
  - value number/boolean/object/array → code 1001: `"The parameter \"value\" has the wrong type! It should be of type (string)"`
  - value null → `"Set the parameter \"value\" = VOID is not allowed in this situation!"`
  - numeric keys → same 1001 error.
- **Structured data:** `JSON.stringify` on set, `JSON.parse` on get.

## Safe No-ops (maxLevel 31, no error)

- `getUserData` on a missing key → `defaultValue` (or `""`)
- `removeUserData` on a missing key
- `clearUserData` on an object with no data
- `getUserDataKeys` on an object with no data → `[]`

## Lifetime

| Survives | Lost |
|---|---|
| `common.recalc`, `common.setObjectName`, `part.updateExpression`, adding/modifying other objects in the same part | Object deleted; `common.save` → `common.clear` → `common.load`; copy via `solid.copy` (copy starts empty) |

## Limits

None practical: values 100K+ chars, keys 1000+ chars, 500+ keys per object. Keys are case-sensitive (`"Key"`, `"key"`, `"KEY"` are separate); empty string is a valid key.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.setUserData({ id: partId, key: 'meta', value: JSON.stringify({ weight: 42.5 }) })

const meta = JSON.parse((await api.v1.common.getUserData({ id: partId, key: 'meta' })).result)
const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result // order not guaranteed

await api.v1.common.removeUserData({ id: partId, key: 'material' })
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'aluminum' })
await api.v1.common.clearUserData({ id: partId })
```

## Related

`common.setObjectName` / `common.getObjectName` · `common.save` / `common.load` · `solid.copy`
