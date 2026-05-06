# Changes — assembly.getFastened training session

## New file: `references/assembly/getFastened.md`

Created dedicated LLM doc for `assembly.getFastened` with:
- Full return shape documentation (all fields always present)
- Doc discrepancy: `id` param only accepts assembly root ID, not instance IDs
- Array form support with null entries for not-found
- Duplicate name behavior (returns first match)
- useCurrentTransform offsets stored and queryable
- Rotation values always radians regardless of input format

## Modified: `references/assembly/fastened.md`

Replaced inline `getFastened` section with cross-reference to the new dedicated doc.

```diff
-`getFastened({ id: asmId, name: 'ConstraintName' })` returns the full constraint state:
-
-```js
-{
-  id, name,
-  mate1: { csys, flip, path: [instId], reorient },
-  mate2: { csys, flip, path: [instId], reorient },
-  xOffset, yOffset, zOffset,
-  xRotation, yRotation, zRotation
-}
-```
-
-Rotations are always returned in **radians** regardless of input format (`"90deg"` → `1.5708`). Non-existent name returns `null` with maxLevel=51.
+See dedicated doc: `references/assembly/getFastened.md`. Query by name, returns full constraint state. Only accepts assembly root ID (not instance IDs).
```
