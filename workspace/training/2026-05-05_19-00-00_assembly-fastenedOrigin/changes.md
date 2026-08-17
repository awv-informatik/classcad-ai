# Changes — assembly.fastenedOrigin

## New file: `references/assembly/fastenedOrigin.md`

```diff
+# assembly.fastenedOrigin
+
+Locks an instance to the assembly origin (world [0,0,0]). Unlike `fastened` (which constrains two instances relative to each other), fastenedOrigin only takes `mate1` and positions the instance relative to the global origin.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+- An instance (`assembly.instance`) with a work coordinate system (`part.workCSys`) in its template
+
+## Key Parameters
+
+- `id` — assembly root ID (required)
+- `mate1.path` — `[instanceId]` (required)
+- `mate1.csys` — work coordinate system ID from the template (required but has **no spatial effect**)
+- `mate1.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Rotates the instance orientation before offsets
+- `mate1.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. CW rotation around the main axis in 90° steps
+- `xOffset` / `yOffset` / `zOffset` — translation from assembly origin in **world frame** (default 0)
+- `xRotation` / `yRotation` / `zRotation` — rotation around assembly origin. Radians (number) or deg string (e.g., `'90deg'`, `'45deg'`)
+- `useCurrentTransform` — `1` (TRUE) to back-compute offsets from the current instance position (no movement)
+- `name` — constraint name (default `"FastenedOrigin"`)
+
+## Alignment Semantics (CRITICAL)
+
+**The csys has NO spatial effect.** Position, origin, and axis orientation of the csys are all irrelevant — tested with csys at origin, at box center, and with rotated axes; all produce identical positioning. The csys is required by the API but serves only as an identifier.
+
+With zero offsets and no rotation, the instance is placed at the assembly origin [0,0,0]. Offsets translate from there in world frame. Rotations rotate around the origin before offsets are applied.
+
+[... full 120-line LLM doc covering: return value, useCurrentTransform, getFastenedOrigin, updateFastenedOrigin, gotchas, common errors, working example, related APIs ...]
```
