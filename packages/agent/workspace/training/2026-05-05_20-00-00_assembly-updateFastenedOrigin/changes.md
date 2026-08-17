# Changes — assembly.updateFastenedOrigin

## Modified: `references/assembly/fastenedOrigin.md`

```diff
-`updateFastenedOrigin({ id: constraintId, xOffset: 100 })` — true partial update. Only specified params change; unspecified params are preserved.
+`updateFastenedOrigin({ id: constraintId, xOffset: 100 })` — true partial update. Only specified params change; unspecified params are preserved. Takes the **constraint ID** (not assembly ID).

-- **True partial update.** Setting `xOffset: 100` preserves yOffset, zOffset, rotations, flip, reorient.
+- **True partial update.** Setting `xOffset: 100` preserves yOffset, zOffset, rotations, flip, reorient — including mate1 sub-params.

-- **Empty update.** `updateFastenedOrigin({ id })` is a valid no-op.
+- **Empty update.** `updateFastenedOrigin({ id })` is a valid no-op — COG and state both unchanged.

+### Updating mate1 Sub-Params
+
+All mate1 sub-params can be updated independently. Pass `mate1: { flip: '-Z' }` without specifying path or csys — other mate1 fields are preserved.
+
+- **mate1.flip** — instance repositions immediately. All 6 values work in updates.
+- **mate1.reorient** — instance repositions immediately. All 4 values work.
+- **mate1.csys** — stored ID changes but has no spatial effect (same as creation).
+- **mate1.path** — retargets the constraint to a different instance. The new instance is repositioned. **The old instance retains its last constrained position** (does not revert to initial transformation).
+
+### Batch Updates
+
+Pass an array of update objects to update multiple constraints in one call (with working example).
+
+### Combined Updates
+
+Multiple param types can be updated in a single call (flip + reorient + offsets + rotations). Application order matches creation: orientation (flip/reorient) → translation (offsets) → rotation.
```
