# Changes: assembly.updateRevolute training (2026-05-08)

## Modified: `references/assembly/revolute.md`

Expanded the `updateRevolute` section from a brief 5-line summary to a comprehensive reference with:
- Return value and batch support documented
- **`id` must be constraint ID** warning (not assembly ID, error code 1007)
- Full list of updatable params with spatial verification notes
- Partial limits section (unique to update vs create)
- Retargeting section (mate path + csys update)
- Error catalog table (6 error types, all non-destructive)

```diff
-`updateRevolute({ id: constraintId, ... })` — true partial update. Unspecified params preserved.
+`updateRevolute({ id: constraintId, ... })` — true partial update. Unspecified params preserved. Returns constraint ID on success, null + maxLevel=51 on failure. Supports batch: pass array, returns array.
 
-- `zOffset: 20` — update offset, preserves everything else
+**`id` must be the constraint ID** (returned from `revolute()`), NOT the assembly ID. Passing the assembly ID gives error code 1007.
+
+### What you can update
+
+- `zOffset: 20` — shifts inst2 along Z-axis (COG verified: z changes by exactly the offset)
 - `zRotationLimits: { min: 0, max: '90deg' }` — add/change limits
-- `zRotationLimits: { min: null, max: null }` — remove limits
+- `zRotationLimits: { min: null, max: null }` — remove both limits
+- `zRotationLimits: null` — also removes both limits
 - `mate2: { flip: '-Z' }` — change flip (no need to include path/csys for flip-only update)
+- `mate2: { reorient: '90' }` — change reorient (only visible with locked limits)
+- `mate2: { path: [newInstId], csys: newWcsId }` — retarget to different instance
 - `name: 'NewName'` — rename; old name immediately unfindable via getRevolute
+- Batch: `updateRevolute([{ id: c1, ... }, { id: c2, ... }])` — returns `[c1Id, c2Id]`
+
+### Partial limits (differs from create!)
+
+On `revolute` (create), omitting min or max errors. On `updateRevolute`, partial limits are fully supported:
+
+- `{ min: '-45deg' }` — sets/changes min, preserves max
+- `{ max: null }` — removes max, preserves min
+- `{}` — **errors**: "The object 'zRotationLimits' is empty!"
+
+### Retargeting
+
+Update mate path + csys together to point at a different instance. The new target moves to satisfy the constraint. The old target stays at its last solved position (solver doesn't reset unconstrained instances).
+
+### Errors (all non-destructive)
+
+| Error | Message | Code |
+|-------|---------|------|
+| Assembly ID not constraint ID | "The provided id for the constraint is not a constraint or relation." | 1007 |
+| Nonexistent ID | "ToId()/TOID() didn't get an existing or valid id." | 1006 |
+| Invalid flip | "Type 'X' is not supported to use as flip type." | 1013 |
+| Invalid reorient | "Type '45' is not supported to use as reorient type." | 1013 |
+| Missing `id` | "'id' must be provided for update." | 1004 |
+| Empty limits `{}` | "The object 'zRotationLimits' is empty!" | — |
+
+All failures are non-destructive — constraint state is fully preserved after any error.
```
