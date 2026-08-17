# common.clearUserData

Removes all user data entries from an object in one call. Part of the five-method CRUD set: `setUserData`, `getUserData`, `removeUserData`, `clearUserData`, `getUserDataKeys`.

## Prerequisites

- Any object with a valid ID (part, entity injection, work plane, sketch, sketch curve, solid — anything)

## Key Parameters

- `id` — target object ID. Required. Works on every object type.

No other parameters. This is the simplest API in the user data set.

## Return Value

- `result: null` (VOID) — always null, success or failure.
- `maxLevel: 31` on success. `51` on error.
- `messages: []` on success (empty array).

## Gotchas

- **Idempotent.** Clearing an object with no user data is a silent no-op — `maxLevel: 31`, no error. Safe to call without checking first. Double-clearing is also fine.
- **Per-object only.** Clearing a part does not cascade to child objects (entity injections, sketches, etc.). Each object's user data is independent.
- **Enables re-set.** After `clearUserData`, the same keys can be set again with `setUserData` — unlike the overwrite trap where `setUserData` on an existing key is a no-op. This makes `clearUserData` the proper "wipe and start fresh" mechanism.
- **User data is session-only.** Not persisted across OFB save/load. After reloading, all user data is already gone.
- **Never pass negative IDs.** May hang the server (consistent with all user data APIs).

## Common Errors

| Symptom | Cause | Fix |
|---|---|---|
| `maxLevel: 51`, code 1006 | Invalid or zero ID | Verify object ID exists |
| `maxLevel: 51`, code 1006 + warning | Nonexistent ID (e.g., 9999) | Use a valid, existing ID |
| `maxLevel: 51`, code 1004 | Missing `id` parameter | Always pass `id` |
| Server hang | Negative ID | Never use negative IDs |

## Usage Hints

- Use `clearUserData` + `setUserData` for bulk update scenarios instead of individual `removeUserData` calls per key
- Handles large key counts (50+ tested) in a single call without issues
- No limit observed on the number of keys that can be cleared

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

// Set multiple metadata entries
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
await api.v1.common.setUserData({ id: partId, key: 'color', value: 'blue' })
await api.v1.common.setUserData({ id: partId, key: 'version', value: '3' })

// Wipe all user data
await api.v1.common.clearUserData({ id: partId })

// Keys are gone — can re-set immediately
await api.v1.common.setUserData({ id: partId, key: 'material', value: 'aluminum' })
const keys = (await api.v1.common.getUserDataKeys({ id: partId })).result
// → ["material"]
```

## Related

- `common.setUserData` — write a key-value pair (no-op if key exists — clear first to bulk-update)
- `common.getUserData` — read a value by key
- `common.removeUserData` — remove a single key (for targeted removal vs. clearing all)
- `common.getUserDataKeys` — list all keys on an object
