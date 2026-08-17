# Skill Changes — User Data Limitations

## New file: `references/common/userData.md`

```diff
+# common.setUserData / getUserData / removeUserData / clearUserData / getUserDataKeys
+
+String key-value metadata store on any object. Useful for tagging objects with application-specific metadata during a session. **Session-scoped only** — not persisted on save/load.
+
+## Prerequisites
+
+- Any valid object ID (part, entity injection, solid, sketch, individual sketch geometry element)
+
+## Key Parameters
+
+### setUserData
+- `id` — any object ID
+- `key` — **must be string**. Case-sensitive. Supports unicode, spaces, special characters, empty string.
+- `value` — **must be string**. No length limit observed (100K+ chars works). Empty string is valid.
+
+### getUserData
+- `id`, `key` — same as above
+- `defaultValue` — optional string, defaults to `""`. Returned when key doesn't exist.
+
+### removeUserData / clearUserData / getUserDataKeys
+- `id` — the target object
+- `key` (removeUserData only) — the key to remove
+
+## Gotchas
+
+### setUserData does NOT overwrite existing keys
+This is the #1 gotcha. Calling `setUserData` on a key that already exists is a **silent no-op** — maxLevel 31, no error messages, but the value does not change. To update a value:
+
+```js
+await api.v1.common.removeUserData({ id, key: 'myKey' })
+await api.v1.common.setUserData({ id, key: 'myKey', value: 'newValue' })
+```
+
+### Not persisted on save/load
+User data does NOT survive OFB save/load cycles. After `common.save` → `common.clear` → `common.load`, all user data is gone. User data is session-scoped metadata only.
+
+### Not copied on duplication
+`solid.copy` does not copy user data from the source to the copy. The copy starts with an empty user data map.
+
+### Non-string types are rejected
+- Number, boolean, object, array → error code 1001
+- Null → VOID not allowed error
+- Keys must also be strings
+
+## Common Patterns
+
+### Storing structured data (JSON workaround)
+### Updating a value (remove-then-set)
+
+## Safe Operations, Behavior During Operations, Limits, Working Example, Related
+(all new content — see full file)
```
