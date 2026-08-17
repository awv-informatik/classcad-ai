# Changes — updateMirror training

## Updated files

### `references/part/updateMirror.md` (updated)

```diff
-All optional params are truly optional — omitted params keep their existing values.
+All optional params are truly optional — omitted params keep their existing values. Calling with only `id` is a valid no-op (returns feature ID, maxLevel=31, geometry unchanged).

-Returns the mirror feature ID on success (maxLevel=31). Returns null on failure (maxLevel=51).
+Returns the mirror feature ID on success (maxLevel=31, messages=[]). Returns null on failure (maxLevel=51).

-- **`targets` is a full replacement.** Passing `targets: [newId]` removes all previous targets and sets only `newId`. To add a target, include all existing targets plus the new one.
+- **`targets` is a full replacement.** Passing `targets: [newId]` removes all previous targets and sets only `newId`. To add a target, include all existing targets plus the new one. Both flat ID format `[id1, id2]` and object format `[{ id: id1 }, { id: id2 }]` work.
+- **Custom work planes work.** References accepts both built-in (`Top`, `Front`, `Right`) and custom (`USERDEFINED`) work plane IDs.
+- **Geometry regenerates on closeFeature.** The actual geometry update happens when you call `closeFeature`, not during `updateMirror`.

+| 1006 | "An element of parameter 'references' has an invalid id!" | Invalid reference ID | Use a valid work plane ID |
+| 1006 | "An element of parameter 'targets' has an invalid id!" | Invalid target ID | Verify feature IDs |
+| 1111 | "There is no reference found for Mirror (CC_Mirror)." | Empty references `[]` | Provide at least one work plane ID |
+| 1004 | "The type '0' is not supported in PrepareAPIParams!" | Empty targets `[]` | Provide at least one target |
```
