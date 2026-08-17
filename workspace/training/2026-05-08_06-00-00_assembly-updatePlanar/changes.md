# Changes — assembly.updatePlanar + assembly.getPlanar

## File modified

`references/assembly/planar.md` — added getPlanar and updatePlanar sections.

## Diff

```diff
+## getPlanar
+
+`getPlanar({ id: asmId, name: 'Planar1' })` — queries a planar constraint by name.
+
+### Parameters
+
+- `id` — **assembly root ID**. Instance/template IDs return null/error.
+- `name` — constraint name string (case-sensitive)
+
+### Return Value
+
+Success (`maxLevel: 31`):
+```js
+{
+  id, name,
+  mate1: { path, csys, flip, reorient },
+  mate2: { path, csys, flip, reorient },
+  zOffset,
+  xOffsetLimits: { min, max },
+  yOffsetLimits: { min, max },
+  zRotationLimits: { min, max }
+}
+```
+
+- Limits always objects. No limits → `{ min: null, max: null }`. Rotation in radians.
+- Live view: reflects updatePlanar changes immediately.
+- Non-existent name → null, maxLevel=51. Bogus ID → error 1006.
+
+## updatePlanar
+
+True partial update. `id` = constraint ID (NOT assembly). Returns constraint ID. Batch supported.
+
+### Key findings:
+- All params updatable: zOffset, xOffsetLimits, yOffsetLimits, zRotationLimits, mate flip/reorient, name
+- **Removing limits preserves position** — does NOT reset to default 0 (differs from create)
+- Mate updates require full sub-object (path+csys+flip+reorient)
+- Error codes: 1007 (wrong ID type), 1006 (nonexistent), 1004 (missing id)
+- All errors non-destructive
+
-## Related
-
-- `assembly.updatePlanar` — modify after creation
-- `assembly.getPlanar` — query by name
+- `assembly.startMovingUnderConstraints` / `moveUnderConstraints` — animate the planar DOFs
```
