# Changes — assembly.transformInstanceTo

## New file: `references/assembly/transformInstanceTo.md`

```diff
+# assembly.transformInstanceTo
+
+Sets the **absolute** position and orientation of an instance using `[origin, xDir, yDir]` format. Unlike `transformInstance` (which applies a relative 4x4 delta), this overwrites the instance's transform completely.
+
+## Prerequisites
+- An assembly with instances already created
+
+## Key Parameters
+- `id` — instance ID. Must be instance type (error 1001 on template IDs).
+- `transformation` — `[[ox,oy,oz], [xx,xy,xz], [yx,yy,yz]]` — 3-point only (4x4 rejected, error 1002).
+- `isLocal` — FALSE (global) or TRUE (owner's local frame).
+
+## Key findings
+- Absolute positioning — overwrites current transform, not additive
+- Only 3-point format accepted (unlike `assembly.instance` which also takes 4x4)
+- Non-unit vectors normalized silently
+- Non-orthogonal vectors orthogonalized via Gram-Schmidt
+- Left-handed impossible with 3-point format
+- Same propagation rules as transformInstance (ET → template+siblings, root → independent)
+- Zero-length/collinear vectors produce errors
+- 7 error cases documented with codes
```
