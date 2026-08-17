diff --git a/references/sketch/create.md b/references/sketch/create.md
new file mode 100644
index 0000000..792c4f1
--- /dev/null
+++ b/references/sketch/create.md
@@ -0,0 +1,90 @@
+# sketch.create
+
+Creates a new sketch inside a part. Returns the sketch ID. Alias: `part.sketch` (identical behavior and signature).
+
+## Prerequisites
+
+- A part (`part.create`)
+- Optional: a work plane ID (`part.workPlane`) or face ID from solid geometry
+
+## Key Parameters
+
+- **`id`** (required) — part ID
+- **`name`** — sketch name, default `"Sketch"`. Duplicate names are silently allowed — no warning, no error. But `part.getSketch` only returns the first match, so use unique names if you need name-based lookup.
+- **`planeId`** (optional) — where to place the sketch:
+  - **Work plane ID** → sketch placed directly on that plane
+  - **Face ID** (from solid geometry) → system auto-creates a work plane on that face, then places the sketch
+  - **Omitted** → sketch placed on the default XY plane at origin (coordinateSystem `[[0,0,0],[1,0,0],[0,1,0],[0,0,1]]`, `planeReference=0`)
+
+## Return Value
+
+```js
+{ result: id, messages?: [...], maxLevel?: real }
+```
+
+Returns the sketch ID (a `CC_Sketch` node). maxLevel=31 on success.
+
+## What Gets Created
+
+Creating one sketch adds **3 objects** to the structure tree:
+
+| Object | Class | Purpose |
+|--------|-------|---------|
+| Sketch | `CC_Sketch` | The sketch itself — this is the returned ID |
+| Sketch Reference | `CC_SketchReference` | Reference geometry container (child of geometry set) |
+| Sketch Dimension Set | `CC_SketchDimensionSet` | Dimension container (child of dimension set) |
+
+IDs increment by ~6 per sketch (e.g., first sketch at 52, second at 58, third at 64).
+
+## Gotchas
+
+- **Duplicate names are silent.** No error, no warning. The second sketch with the same name just gets a different ID. `part.getSketch` returns the **first** match only — so duplicates make later sketches unreachable by name.
+- **`sketch.create` vs `part.sketch`** — these are the same API with identical params and behavior. Both live in different namespaces but do the same thing.
+- **Default plane is XY.** When `planeId` is omitted, the sketch lives on the XY plane at origin. The `planeReference` member is 0 (no explicit reference).
+- **Faces auto-create work planes.** When `planeId` is a face, the system creates an implicit work plane on that face. This is how you sketch on existing solid geometry.
+
+## Common Errors
+
+| Error | Code | Cause |
+|-------|------|-------|
+| "parameter 'id' must be provided" | 1004 | Missing `id` param |
+| "invalid id" | 1006 | Non-existent or invalid part ID |
+
+## Working Example
+
+```js
+const partId = (await api.v1.part.create({ name: 'MyPart' })).result
+
+// Basic — default XY plane
+const sk1 = (await api.v1.sketch.create({ id: partId })).result
+
+// On a custom work plane
+const wpId = (await api.v1.part.workPlane({
+  id: partId,
+  normal: [0, 0, 1],
+  position: [0, 0, 50],
+})).result
+const sk2 = (await api.v1.sketch.create({
+  id: partId,
+  planeId: wpId,
+  name: 'SketchOnPlane',
+})).result
+
+// On a face (from a box)
+const boxId = (await api.v1.part.box({ id: partId, xLen: 100, yLen: 80, zLen: 60 })).result
+// Get face IDs from graphic data
+const faceId = boxR.graphic.containers[0].meshes[0].id
+const sk3 = (await api.v1.sketch.create({
+  id: partId,
+  planeId: faceId,
+  name: 'SketchOnFace',
+})).result
+```
+
+## Related
+
+- `part.sketch` — identical alias in the part namespace
+- `part.getSketch` — retrieve sketch ID by name (returns first match only)
+- `sketch.setWorkPlane` — reassign sketch to a different work plane (work plane IDs only — does NOT accept face IDs)
+- `sketch.deleteSketch` — delete sketches by ID array
+- `part.workPlane` — create work planes to place sketches on
diff --git a/references/sketch/deleteSketch.md b/references/sketch/deleteSketch.md
new file mode 100644
index 0000000..94f7fcd
--- /dev/null
+++ b/references/sketch/deleteSketch.md
@@ -0,0 +1,47 @@
+# sketch.deleteSketch
+
+Deletes one or more sketches by their IDs.
+
+## Prerequisites
+
+- Existing sketch IDs (`sketch.create`)
+
+## Key Parameters
+
+- **`ids`** (required) — array of sketch IDs to delete. Can be a single ID `[skId]` or multiple `[sk1, sk2, sk3]`.
+
+## Return Value
+
+```js
+{ result: null (VOID), messages?: [...], maxLevel?: real }
+```
+
+Returns VOID on success. maxLevel=31.
+
+## Gotchas
+
+- **Empty array is a no-op.** `ids: []` succeeds silently (maxLevel=31, no error). Does nothing.
+- **Invalid/already-deleted IDs produce errors.** maxLevel=51, error code 1006. You get both a warning (41, "ToId() didn't get valid id") and an error (51, "invalid id").
+- **Deletion is immediate.** After deletion, `part.getSketch` for that sketch name returns null with error.
+- **Removes all 3 internal objects.** The `CC_Sketch`, `CC_SketchReference`, and `CC_SketchDimensionSet` nodes are all removed.
+
+## Common Errors
+
+| Error | Code | Cause |
+|-------|------|-------|
+| "invalid id" | 1006 | Non-existent or already-deleted sketch ID |
+
+## Working Example
+
+```js
+// Delete single
+await api.v1.sketch.deleteSketch({ ids: [sketchId] })
+
+// Delete multiple
+await api.v1.sketch.deleteSketch({ ids: [sk1, sk2, sk3] })
+```
+
+## Related
+
+- `sketch.create` — create sketches
+- `part.getSketch` — verify sketch exists before/after deletion
diff --git a/references/sketch/setWorkPlane.md b/references/sketch/setWorkPlane.md
new file mode 100644
index 0000000..d310efc
--- /dev/null
+++ b/references/sketch/setWorkPlane.md
@@ -0,0 +1,50 @@
+# sketch.setWorkPlane
+
+Reassigns a sketch to a different work plane after creation.
+
+## Prerequisites
+
+- An existing sketch (`sketch.create`)
+- A work plane (`part.workPlane`)
+
+## Key Parameters
+
+- **`id`** (required) — sketch ID
+- **`planeId`** (required) — work plane ID. **Must be a work plane** — face IDs, sketch IDs, and part IDs are rejected with error 1001.
+
+## Return Value
+
+```js
+{ result: null (VOID), messages?: [...], maxLevel?: real }
+```
+
+Returns VOID on success. maxLevel=31.
+
+## Gotchas
+
+- **Only accepts work plane IDs.** Unlike `sketch.create` which accepts both work planes and faces, `setWorkPlane` only accepts work plane type IDs. Error message: "Provide only following id types: [\"workplane\"]".
+- **To move a sketch to a face:** first create a work plane on that face with `part.workPlane`, then pass the work plane ID to `setWorkPlane`.
+
+## Common Errors
+
+| Error | Code | Cause |
+|-------|------|-------|
+| "invalid id" | 1006 | Non-existent planeId |
+| "wrong id type" | 1001 | planeId is not a work plane (e.g., face, sketch, part) |
+
+## Working Example
+
+```js
+const skId = (await api.v1.sketch.create({ id: partId })).result
+const wpId = (await api.v1.part.workPlane({
+  id: partId,
+  normal: [0, 1, 0],
+  position: [0, 50, 0],
+})).result
+await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
+```
+
+## Related
+
+- `sketch.create` — initial sketch placement (accepts faces too)
+- `part.workPlane` — create the target work plane
