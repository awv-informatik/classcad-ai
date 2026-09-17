# common.removeUserData

Removes one user data entry by key from any object. CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`.

## Key Parameters

- `id` — target object ID (part, entity injection, work plane, sketch — anything with an ID). Required; must exist — not null, not zero, not a string.
- `key` — string, case-sensitive. Required (omitting → 1004). `""` is a valid key (removes the entry keyed by empty string).

## Return Value

`result: null` (VOID) on success and failure. maxLevel 31 + `messages: []` on success, 51 on error.

## Gotchas

- **Idempotent.** Removing a missing key (or removing twice) is a silent no-op, maxLevel 31 — no need to check existence first.
- **Required for updates.** `setUserData` is a no-op on existing keys. To change a value: `removeUserData` → `setUserData`.
- **Per-object.** Removing a key from one object doesn't affect the same key elsewhere.

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| maxLevel 51, code 1004 | Missing `key` | Always pass `key` |
| maxLevel 51, code 1006 | Invalid or zero ID | Verify object ID exists |
| maxLevel 51, code 1001 | `id` is null/VOID (e.g. result of a failed call) | Use an API that returns an ID |
| maxLevel 51, code 0 + 1006 | String ID (not a number) | IDs are numeric |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.removeUserData({ id: partId, key: 'material' })

const val = (await api.v1.common.getUserData({ id: partId, key: 'material', defaultValue: '__GONE__' })).result
// → "__GONE__"

// Update pattern: remove then re-set
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'aluminum' })
```

## Related

`common.setUserData` · `common.getUserData` · `common.clearUserData` · `common.getUserDataKeys`
