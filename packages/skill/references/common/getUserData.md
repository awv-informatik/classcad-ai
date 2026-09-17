# common.getUserData

Reads a string value from an object's user data by key; returns a default if the key is missing. CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`.

## Key Parameters

- `id` — target object (part, entity injection, work plane, sketch, solid — any type).
- `key` — string, case-sensitive. Required (omitting → 1004). Need not exist.
- `defaultValue` — **must be a string**; returned for missing keys. Default `""`. A number/boolean/null gives maxLevel 51 (no coercion).

## Return Value

`result`: the stored string, or `defaultValue`. maxLevel 31 on success (also when the default is used); 51 on bad ID, missing `key`, non-string `defaultValue`.

## Gotchas

- **Missing key is not an error** — `""` (or `defaultValue`), maxLevel 31, no warning. "Empty value" vs "never set" is only distinguishable via `getUserDataKeys` or a sentinel `defaultValue: '__MISSING__'`.
- **Session-only.** Not persisted across OFB save/load.
- **Not copied** by `solid.copy` and similar.
- **Overwrite trap.** Setting an existing key again doesn't change it (`setUserData` ignores duplicates) — `removeUserData` → `setUserData`.
- **IDs:** 0 and nonexistent → maxLevel 51, code 1006. **Negative IDs (`id: -1`) crash the ClassCAD worker — never pass them.**
- Keys: any string (empty, unicode, emoji, special chars, 500+ chars, embedded newlines). Values up to at least 50KB are not truncated. Same key on different objects is independent.
- Non-strings: store `JSON.stringify(obj)`, read with `JSON.parse(result)`.

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| maxLevel 51, result null | Nonexistent or zero ID | Verify object ID |
| maxLevel 51, code 1004 | Missing `key` | Pass `key` |
| maxLevel 51 with defaultValue | Non-string defaultValue | `defaultValue: '42'`, not `42` |
| Returns `""` unexpectedly | Key never set, no defaultValue | Use a sentinel defaultValue |
| Old value after "update" | setUserData overwrite is a no-op | remove, then set |
| `""` after file reload | Not persisted in OFB | Re-set after loading |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })

const val = (await api.v1.common.getUserData({ id: partId, key: 'material' })).result
// → "steel"
const missing = (await api.v1.common.getUserData({ id: partId, key: 'color', defaultValue: 'unset' })).result
// → "unset"   (without defaultValue: "")
```

## Related

`common.setUserData` · `common.removeUserData` · `common.clearUserData` · `common.getUserDataKeys`
