# Changes — assembly.updateFastened training

## Modified: `references/assembly/fastened.md`

```diff
@@ -76,6 +76,29 @@
 
 `updateFastened({ id: constraintId, xOffset: 100 })` — partial update. Only specified params change; unspecified params are preserved.
 
+### Key Behaviors
+
+- **True partial update.** Set `xOffset: 100` and `yOffset`, `zOffset`, rotations, flip, reorient all stay unchanged.
+- **Zeroing works.** `zRotation: 0` removes rotation. `xOffset: 0` removes offset. The instance moves back.
+- **Name update.** `updateFastened({ id: fId, name: 'New' })` renames the constraint. Old name immediately becomes unfindable via `getFastened`.
+- **Mate path swap.** Passing `mate2: { path: [newInst], csys: wcs }` reassigns the constraint to a different instance. The previously constrained instance stays at its current position (no snap-back). The new instance is immediately repositioned.
+- **Csys swap.** Changing `mate1.csys` or `mate2.csys` stores the new ID but has NO spatial effect (same as creation — csys is irrelevant to positioning).
+- **Flip/reorient via update.** Must include `path` and `csys` in the mate object alongside flip/reorient. Produces same spatial effects as at creation time.
+- **useCurrentTransform in update.** Back-computes offsets from the current relative position. No movement occurs. If the instance is already at the constraint position, offsets stay the same.
+- **Empty update.** `updateFastened({ id: fId })` (no params besides id) is a valid no-op — returns the constraint ID with maxLevel=31.
+- **Array form.** `updateFastened([{ id: fId1, xOffset: 80 }, { id: fId2, zRotation: '90deg' }])` updates multiple constraints at once, returns `[id1, id2]`.
+
+### updateFastened Errors
+
+| Error | Code | Cause |
+|---|---|---|
+| `"constraint id does not exist"` | 1006 | Invalid/nonexistent ID |
+| `"not a constraint or relation"` | 1007 | Assembly root or instance ID passed as constraint |
+| `"invalid id" in csys` | 1006 | Bad csys ID |
+| `"not supported as flip type"` | 1013 | Invalid flip string |
+
+Failed updates do NOT corrupt the constraint. All params remain unchanged after an error.
+
 ## Gotchas
```
