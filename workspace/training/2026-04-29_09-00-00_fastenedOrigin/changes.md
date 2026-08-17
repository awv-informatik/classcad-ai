# Changes — assembly.fastenedOrigin

## New file: `references/assembly/fastenedOrigin.md`

```diff
+# assembly.fastenedOrigin
+
+Locks an instance at a position/orientation relative to the assembly's global origin. Unlike `fastened` (which constrains two instances to each other), `fastenedOrigin` has only one mate and positions relative to the global coordinate system. Typical use: anchor one "base" instance at the origin, then constrain other instances to it with `fastened`.
+
+## Prerequisites
+
+- A root assembly (`assembly.create`)
+- At least one instance with a work coordinate system in its template
+- Must be in assembly context (`setCurrentProduct({ id: asmId })`)
+
+## Key Parameters
+
+- `id` (required) — assembly ID where the constraint is created
+- `mate1` (required) — single mate object:
+  - `path` (required) — array with instance ID(s). For top-level: `[instId]`. For sub-assembly children: `[etChildId]` (single ET child, NOT multi-element)
+  - `csys` (required) — work coordinate system ID from the instance's template. Must be reachable from the instance in `path`
+  - `flip` (optional, default `'Z'`) — `'Z'` | `'-Z'` | `'X'` | `'-X'` | `'Y'` | `'-Y'`. Defines which WCS axis aligns with the global main axis
+  - `reorient` (optional, default `'0'`) — `'0'` | `'90'` | `'180'` | `'270'`. Rotation around the main axis in 90° steps. **Values are strings**
+- `xOffset` / `yOffset` / `zOffset` (optional, default 0) — translation of the instance. Applied AFTER rotation
+- `xRotation` / `yRotation` / `zRotation` (optional, default 0) — rotation around global axes. Accepts `real` (radians) OR `string` with degree suffix (e.g., `'45deg'`, `'90deg'`)
+- `name` (optional, default `'FastenedOrigin'`) — constraint name. Duplicates allowed
+- `useCurrentTransform` (optional, default FALSE) — pass `1` for TRUE. Ignores offset/rotation params and reverse-computes them from the instance's current transformation.
+
+## Transformation Model
+
+The constraint positions the instance in this order:
+
+1. **Place** instance origin at the global origin (WCS orientation defines axis alignment via flip/reorient)
+2. **Rotate** instance around the global origin by xRotation/yRotation/zRotation
+3. **Translate** instance by xOffset/yOffset/zOffset
+
+**WCS position within the template is irrelevant for positioning.** Only the WCS orientation matters.
+
+## Gotchas
+
+- Multiple fastenedOrigin on same instance allowed (unlike fastened's self-referencing block)
+- Constraint overrides instance transformation
+- Duplicate names allowed, getFastenedOrigin returns first match
+- useCurrentTransform: pass `1`, not `true` (param type is `real`)
+- Degree strings stored as radians in getFastenedOrigin return value
+- getFastenedOrigin requires assembly ID, not instance ID
+- Reorient values are strings ('0', '90', '180', '270'), not numbers
+
+## Common Errors
+
+- mate1/id/path/csys must be provided (code 1004)
+- Wrong id type in path (code 1001)
+- Invalid/nonexistent IDs (code 1006)
+- WCS not reachable from path (code 1014)
+- Multi-element path incorrect (code 1014)
```
