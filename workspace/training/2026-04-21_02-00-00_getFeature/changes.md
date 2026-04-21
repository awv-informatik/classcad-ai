# Changes — part.getFeature training

## New file: `references/part/getFeature.md`

```diff
+# part.getFeature
+
+Looks up a feature by name inside a part and returns its ID. This is the primary way to retrieve a feature when you know its name but not its ID.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A feature inside that part (box, cylinder, cone, sphere, boolean, extrusion, etc.)
+
+## Key Parameters
+
+- **`id`** (required) — part ID. Must be a part — any other ID type gives error 1001.
+- **`name`** (required) — exact feature name. **Case-sensitive** and **literal** — `"Box"` does not match `"box"` or `"BOX"`.
+
+## Return Value
+
+**On success:**
+```js
+{ result: featureId, messages: [], maxLevel: 31 }
+```
+
+**On not found:**
+```js
+{ result: null, messages: [{ code: 0, level: 51, message: 'Feature with name "X" does not exist' }], maxLevel: 51 }
+```
+
+Returns `null` (not VOID) when no match is found.
+
+## Scope — What It Can and Cannot Find
+
+`getFeature` searches the **OperationSequence** (the feature/operation tree). It finds:
+
+- **Solid primitives:** Box, Cylinder, Cone, Sphere
+- **Profile-based features:** Extrusion, Revolve, Twist
+- **Boolean operations:** Union, Subtraction, Intersection
+- **Modification features:** Chamfer, Fillet, Slice
+- **Transformation features:** Mirror, LinearPattern, CircularPattern, Translation, Rotation
+- **Consumed tools:** Features consumed by a boolean remain findable
+
+It does **NOT** find:
+
+- **Sketches** — use `part.getSketch` instead
+- **Work geometry** (planes, axes, points) — use `part.getWorkGeometry` instead
+- **Built-in origin features** (Origin, Top, Front, Right, XAxis, YAxis, ZAxis) — not reachable
+
+## Auto-Naming Convention
+
+When creating features without a custom name, the system assigns default names:
+
+| Count | Name |
+|-------|------|
+| 1st   | `Type` (e.g., "Box") |
+| 2nd   | `Type0` (e.g., "Box0") |
+| 3rd   | `Type1` (e.g., "Box1") |
+| Nth   | `Type{N-2}` |
+
+No space, no underscore — just the type name with a zero-indexed number appended starting from the second instance.
+
+## Gotchas
+
+- **Case-sensitive.** `"Box"` ≠ `"box"`. No fuzzy matching.
+- **First-match only.** Duplicate names return the first-created feature.
+- **Rollback does not hide features.** `getFeature` ignores rollback bar position.
+- **Feature reordering has no effect.** `operationMoveBefore` doesn't affect lookup.
+- **Use `setObjectName` to rename, not `updateBox({ name })`.** Only `common.setObjectName` changes the lookup name.
+
+## Common Errors
+
+| Code | Message | Cause |
+|------|---------|-------|
+| 0 | "Feature with name X does not exist" | No match |
+| 1004 | "parameter name/id must be provided" | Missing required param |
+| 1001 | "wrong id type" | Not a part ID |
+| 1006 | "invalid id" | Non-existent or zero ID |
+
+## Working Example + Related APIs included.
```
