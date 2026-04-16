# Changes — common.clear training

## New file: `references/common/clear.md`

```diff
+# common.clear
+
+Deletes all objects in the current drawing. Resets the drawing to an empty state.
+
+## Prerequisites
+
+None — can be called at any time, even on an empty drawing.
+
+## Key Parameters
+
+- **No required parameters.** `clear()`, `clear({})`, and `clear({ keepIds: [] })` are all equivalent.
+- `keepIds` — optional `Array<id>`. IDs of objects to preserve during clear. See keepIds Behavior below.
+
+## Return Value
+
+Returns VOID (null). maxLevel=31 (info). Empty messages array.
+
+## Gotchas
+
+- IDs reset after full clear
+- Safe on empty drawing
+- part.create only works once per drawing — clear removes the restriction
+
+## keepIds Behavior
+
+- Containers only — not geometry
+- Part: preserved (including expressions), child features deleted unless also in keepIds
+- Entity injection: only if parent part also kept
+- Solids: ID accepted silently but internal geometry broken
+- ATOMIC: any invalid ID aborts entire clear
+- STEP/OFB export may hang on partially-cleared state
+
+## Working examples, error table, related APIs included
```
