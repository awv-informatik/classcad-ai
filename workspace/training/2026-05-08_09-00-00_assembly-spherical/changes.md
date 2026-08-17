# Changes — assembly.spherical

## New file: `references/assembly/spherical.md`

```diff
+# assembly.spherical
+
+Creates a spherical (ball-joint) constraint between two instances. Locks 3 translational DOF (origins coincide), leaves all 3 rotational DOF free.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
+- **Ground at least one instance** with `fastenedOrigin` before applying spherical — otherwise the solver repositions BOTH instances
+
+## Key Parameters
+
+- `id` — assembly root ID (required)
+- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
+- `yRotationLimits` — `{ max }` defining max rotation around Y-axis. Accepts radians (number) or degree strings (`'45deg'`). Stored internally as radians. Omit or pass `null` for no limit.
+- `name` — constraint name (default `"Spherical"`)
+
+## Alignment Semantics (CRITICAL)
+
+**Same as all other assembly constraints.** The csys position and axes have NO spatial effect.
+**No offset params.** Spherical has NO offset parameters unlike other constraints.
+
+## DOF and Behavior
+
+- **Locked:** X/Y/Z-translation (origins coincide)
+- **Free:** X/Y/Z-rotation (all rotations unconstrained)
+
+## flip and reorient — NO EFFECT
+
+All rotation DOFs free → solver absorbs any flip/reorient. No observable effect.
+
+## yRotationLimits
+
+- `{ max: 0.785 }` — radians
+- `{ max: '45deg' }` — degree string
+- `null` or omit — no limit
+- getSpherical always returns yRotationLimits with max as number or null
+
+## getSpherical / updateSpherical / Batch / Errors / Working Example
+
+(Full content in file — standard patterns matching other kinematic constraints)
```
