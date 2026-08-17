# Changes — part.sketch training

## New file: `references/part/sketch.md`

```diff
+# part.sketch
+
+Creates a new sketch inside a part. **Identical alias of `sketch.create`** — same parameters, same behavior, same return value. Use whichever namespace you prefer.
+
+## Prerequisites
+
+- A part (`part.create`)
+- Optional: a work plane ID (`part.workPlane`) or face ID from solid geometry
+
+## Key Parameters
+
+- **`id`** (required) — part ID. Must be a part — passing other ID types gives error 1001.
+- **`planeId`** (optional) — where to place the sketch:
+  - **Work plane ID** → sketch placed directly on that plane
+  - **Face ID** (from solid geometry) → auto-creates a work plane on that face
+  - **Omitted** → default XY plane at origin
+  - Accepted types per error message: `workplane`, `face-plane`. Anything else gives error 1001.
+- **`name`** (optional, default `"Sketch"`) — very permissive: empty strings, 200+ chars, special characters like `/()` all accepted without error or warning.
+
+## Return Value
+
+Returns the sketch ID (`CC_Sketch` node). maxLevel=31 on success. Empty messages array.
+
+## What Gets Created
+
+Each call creates **3 internal objects** consuming ~6 ID slots:
+- `CC_Sketch`, `CC_SketchReference`, `CC_SketchDimensionSet`
+
+## Gotchas
+
+- Duplicate names are silent — no error. `getSketch` returns first match only.
+- Name validation is absent — empty strings, special chars, 200+ chars all accepted.
+- `planeId` type is strict — only `workplane` and `face-plane` accepted.
+
+## Common Errors
+
+- 1004: missing `id`
+- 1006: invalid/non-existent ID
+- 1001: wrong ID type for `id` (must be `part`) or `planeId` (must be `workplane`/`face-plane`)
+
+## Working Example, Related APIs included.
```
