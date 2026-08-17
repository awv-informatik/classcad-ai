# Changes — assembly.fastened training

## New file: `references/assembly/fastened.md`

```diff
+# assembly.fastened
+
+Creates a rigid constraint between two instances, locking their relative position and orientation. The primary constraint type for fixing parts together in an assembly.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
+
+## Key Parameters
+
+- `id` — assembly root ID (required)
+- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
+- `xOffset` / `yOffset` / `zOffset` — translation from inst1's origin in **world frame** (NOT in csys frame)
+- `xRotation` / `yRotation` / `zRotation` — rotation of inst2 around inst1's origin. Radians, or `"Ndeg"` string (e.g., `'45deg'`, `'90deg'`)
+- `useCurrentTransform` — `1` (TRUE) to lock the current relative position as the constraint, back-computing equivalent offsets
+- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Rotates inst2 to redefine the "main axis"
+- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. CW rotation around the main axis in 90° steps
+
+## Alignment Semantics (CRITICAL)
+
+**The csys position and axes do NOT determine the base alignment.** With zero offsets and no rotation, inst2 is placed at inst1's origin regardless of where the csys origins are in their templates.
+
+## Flip and Reorient
+
+(flip/reorient rotation table with measured rotation semantics)
+
+## Gotchas
+
+- CSys does NOT define alignment point — offsets are the only translation mechanism
+- Offsets are world-frame, not csys-local
+- Duplicate constraint names silently allowed
+- Self-fastened properly rejected (error 1014, no hang)
+- "deg" strings stored as radians internally
+
+## Common Errors
+
+(error table with 7 tested cases)
+
+## Working Example, getFastened, updateFastened sections
```
