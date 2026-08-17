# Changes — part.workPlane training session

## New file: `references/part/workPlane.md`

```diff
+# part.workPlane
+
+Creates a work plane feature — an invisible construction reference used as a sketch parent, mirror plane, or positioning aid.
+
+## Prerequisites
+
+- A part (`part.create`)
+- For referenced types (PLANE, EDGEPOINT, etc.): brep geometry IDs from `part.getGeometryIds` or work geometry IDs
+
+## Key Parameters
+
+- **`id`** (required) — part ID
+- **`name`** — feature name, default `"WorkPlane"`. Duplicate names are allowed but `getWorkGeometry` only returns the first match. Use unique names.
+- **`type`** — one of 7 types (default `"USERDEFINED"`):
+
+| Type | References needed | Description |
+|------|------------------|-------------|
+| `USERDEFINED` | none | Free-standing plane defined by `normal`, `position`, `offset` |
+| `PLANE` | 1 face or work plane | Copies a reference plane. `offset` shifts along normal |
+| `EDGEPOINT` | 1 edge/axis + 1 point | Edge + point define the plane |
+| `3POINTS` | 3 points | Three points define the plane |
+| `POINTNORMAL` | 1 point + 1 edge/axis | Point sets position, edge/axis direction becomes the normal |
+| `POINTFACE` | 1 point + 1 face/plane | Point sets position, face normal becomes the plane normal |
+| `LINEPLANEANGLE` | 1 edge/axis + 1 face/plane | Line midpoint = position, plane = initial orientation, `angle` rotates around the line |
+
+- **`references`** — array of brep or work geometry IDs. Not needed for USERDEFINED.
+- **`normal`** — `[x,y,z]` vector, USERDEFINED only. Default `[1,0,0]` (YZ plane, **not** XY).
+- **`position`** — `[x,y,z]` center point, USERDEFINED only. Default `[0,0,0]`.
+- **`offset`** — distance along normal. Works on all types. Default `0`.
+- **`angle`** — radians or expression string, LINEPLANEANGLE only.
+
+(plus Return Value, Gotchas, Common Errors, Built-in Work Planes, Working Example, Related sections)
```
