diff --git a/SKILL.md b/SKILL.md
index 0ecae88..04841f6 100644
--- a/SKILL.md
+++ b/SKILL.md
@@ -12,35 +12,21 @@ Client applications interact with ClassCAD **exclusively through public APIs and
 api.v1.<domain>.<method>(param)
 ```
 
-### Key Characteristics
-
-- **Deterministic execution** — same input always produces the same CAD model
-- **Headless** — no UI, no interaction logic, no client assumptions
-- **Stable APIs** — external contracts remain stable even as internals evolve
-- **Plugin-based** — geometry kernel, constraint solving, etc. provided via plugins
-
-### Deployment Modes
-
-| Mode | Description |
-|------|-------------|
-| **Proxy-based** | ClassCAD runs as an isolated C++ process behind a proxy (`@classcad/node`) |
-| **WebAssembly** | ClassCAD runtime compiled to WASM, runs in browser (typically in a Web Worker) |
-
 ---
 
 ## API Domains
 
 The v1 API is organized into **7 domains**. Each has its own reference file in this skill:
 
-| Domain | Namespace | Reference | Description |
-|--------|-----------|-----------|-------------|
-| **Assembly** | `api.v1.assembly.*` | [references/assembly.md](references/assembly.md) | Assembly building: templates, instances, constraints, patterns |
-| **Common** | `api.v1.common.*` | [references/common.md](references/common.md) | Session management, load/save, settings, appearance, user data |
-| **Curve** | `api.v1.curve.*` | [references/curve.md](references/curve.md) | 2D/3D curve creation in shape containers |
-| **Drawing2D** | `api.v1.drawing2d.*` | [references/drawing2d.md](references/drawing2d.md) | 2D views, dimensions, DXF/SVG export |
-| **Part** | `api.v1.part.*` | [references/part.md](references/part.md) | Feature-based part modeling (primitives, booleans, patterns, sketches) |
-| **Sketch** | `api.v1.sketch.*` | [references/sketch.md](references/sketch.md) | 2D constrained sketches on work planes |
-| **Solid** | `api.v1.solid.*` | [references/solid.md](references/solid.md) | Direct solid modeling within entity injection features |
+| Domain        | Namespace            | Reference                                          | Description                                                            |
+| ------------- | -------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
+| **Assembly**  | `api.v1.assembly.*`  | [references/assembly.md](references/assembly.md)   | Assembly building: templates, instances, constraints, patterns         |
+| **Common**    | `api.v1.common.*`    | [references/common.md](references/common.md)       | Session management, load/save, settings, appearance, user data         |
+| **Curve**     | `api.v1.curve.*`     | [references/curve.md](references/curve.md)         | 2D/3D curve creation in shape containers                               |
+| **Drawing2D** | `api.v1.drawing2d.*` | [references/drawing2d.md](references/drawing2d.md) | 2D views, dimensions, DXF/SVG export                                   |
+| **Part**      | `api.v1.part.*`      | [references/part.md](references/part.md)           | Feature-based part modeling (primitives, booleans, patterns, sketches) |
+| **Sketch**    | `api.v1.sketch.*`    | [references/sketch.md](references/sketch.md)       | 2D constrained sketches on work planes                                 |
+| **Solid**     | `api.v1.solid.*`     | [references/solid.md](references/solid.md)         | Direct solid modeling within entity injection features                 |
 
 ---
 
@@ -58,7 +44,7 @@ Every API call returns an object with this structure:
 }
 ```
 
-> **AGENT HINT**: Always check `messages` for warnings/errors. `maxLevel` indicates the highest severity level.
+Always check `messages` for warnings/errors. `maxLevel` indicates the highest severity level.
 
 ### Parameter Conventions
 
@@ -154,16 +140,3 @@ const { result } = api.v1.common.save({ format: 'OFB', encoding: 'base64' })
 // Save as STEP
 api.v1.common.save({ file: '/path/to/model.stp', stp: { version: 2 } })
 ```
-
----
-
-## Agent Usage Notes
-
-1. **Always read the specific domain reference** before generating API calls — parameter names and types vary per API.
-2. **IDs are opaque** — never hardcode them; always capture from a previous API result.
-3. **Order matters** for feature-based modeling — features build on previous features.
-4. **Sketch workflow**: create sketch → add geometry → add constraints/dimensions → close feature → use in extrusion/revolve.
-5. **Entity injection** is the gateway for direct solid/curve operations within a part.
-6. **Assembly constraints** (fastened, revolute, cylindrical, etc.) position instances relative to each other using **mates** that reference work coordinate systems (WCS).
-7. **Expressions** allow parametric linking: `api.v1.part.expression(...)` + `api.v1.part.linkWithExpression(...)`.
-8. **`api.v1.common.batch()`** allows bundling multiple API calls into a single round-trip.
diff --git a/references/part.md b/references/part.md
index 848f28b..122f347 100644
--- a/references/part.md
+++ b/references/part.md
@@ -817,7 +817,7 @@ api.v1.part.updateWorkPlane({ id: workPlane, type: 'LINEPLANEANGLE', angle: '45d
 
 > **AGENT NOTE (trained 2026-03-19):** Confirmed workflow: create two sketches on same part, extrude both, then `boolean({ id: partId, type: 'SUBTRACTION', target: baseFeatureId, tools: [holeFeatureId] })`. target = feature to keep, tools = features to subtract/union/intersect.
 
-> **AGENT NOTE (trained 2026-03-19):** All three boolean types (UNION, SUBTRACTION, INTERSECTION) produce accurate geometry — volumes match mathematical expectations. Multiple tools supported in one call (e.g. subtract 3 holes at once). Object-style `{ id: featureId }` syntax works for target/tools alongside plain IDs. Empty tools array fails with error. Non-overlapping subtraction succeeds silently (tool body disappears, no error). **CRITICAL:** Mirror feature IDs cannot be used as boolean tools — error "Entity 'Mirror' is not available. It has already been consumed/used in another operation." Restructure workflows to avoid using mirror IDs in subsequent booleans.
+> **AGENT NOTE (trained 2026-03-20):** All three boolean types (UNION, SUBTRACTION, INTERSECTION) produce accurate geometry. Multiple tools supported in one call (e.g. subtract 3 holes at once). Object-style `{ id: featureId }` syntax works for target/tools alongside plain IDs. `indices` field (0-based) selects specific solid instances from multi-solid features (e.g. patterns): `tools: [{ id: patternId, indices: [2] }]` or `target: { id: patternId, indices: [0] }`. 3+ tools in INTERSECTION computes target ∩ tool1 ∩ tool2. **Non-overlapping behavior differs by type:** UNION and SUBTRACTION succeed silently (no error); INTERSECTION returns feature ID but emits ERROR "blank solid was removed" (geometry is empty). Empty tools array → ERROR code 1004. Same feature as both target and tool succeeds silently (no error) — potentially dangerous. Boolean features can be chained (use as target for subsequent booleans), patterned (linearPattern), and queried for brep edges (fillet/chamfer). **CRITICAL:** Mirror feature IDs cannot be used as boolean tools — error "Entity 'Mirror' is not available. It has already been consumed/used in another operation." Restructure workflows to avoid using mirror IDs in subsequent booleans.
 
 Creates a boolean feature.
 
@@ -855,9 +855,7 @@ api.v1.part.boolean({ id: part, target: feature, tools: [{ id: pattern, indices:
 
 ## updateBoolean(param)
 
-> **AGENT NOTE (trained 2026-03-19):** CRITICAL: Requires `openFeature({ id: featureId })` before calling, then `closeFeature({ id: featureId })` after. Without this, fails with "not active and open" error. Can change type, name, target, or tools when feature is open.
-
-> **AGENT NOTE (trained 2026-03-20):** Returns the feature ID on success (not null). Same as `updateExtrusion`, unlike `updateBox` which returns null.
+> **AGENT NOTE (trained 2026-03-20):** CRITICAL: Requires `openFeature({ id: featureId })` before calling, then `closeFeature({ id: featureId })` after. Without this, fails with "not active and open" error. Can change type, name, target, or tools when feature is open — partial updates work (e.g. change only type, leave target/tools unchanged). Returns the boolean feature ID on success (not null). Target and tools use object syntax in updates: `target: { id: featureId }`, `tools: [{ id: featureId }]`. **WARNING:** `updateBoolean` does not validate that the feature is actually a boolean — it dispatches to whatever feature type is open. Calling it on an open extrusion will attempt to update the extrusion and fail with extrusion-specific type validation errors.
 
 Updates a boolean feature.
 
@@ -1079,6 +1077,8 @@ api.v1.part.updateWorkAxis({ id: workAxis, position: [0, 150, 0], direction: [1,
 ## linearPattern(param)
 
 > **AGENT NOTE (trained 2026-03-19):** `count` includes the original — count=4 produces 4 total instances (original + 3 copies). `distance` is per-instance spacing, not total span (count=4, distance=50 → instances at 0, 50, 100, 150). Expression distances work (e.g. `'150/3'`). Two workPoints can define direction: `references: [wp1, wp2]`. 2D grid via dir1+dir2 works (e.g. 5×5 grid). Boolean params (`inverted`, `merged`) must be actual boolean type, NOT strings — passing `'TRUE'` fails with "wrong type" error. Boolean subtraction features can be patterned (pass the boolean feature id as target).
+>
+> **AGENT NOTE (trained 2026-03-20):** `targets` supports all three forms in practice: `[featureId]`, `[{ id: featureId }]`, and `[{ id: featureId, indices: [i] }]` (indices are 0-based). Multi-target patterns copy all targets as one group at each step. `inverted` flips direction for either axis (`dir1.inverted` and `dir2.inverted`). `dir1.merged: true` fuses overlapping instances (union-like result): with a 40×20×10 seed, `count=3`, `distance=20`, merged result volume is `16000` (overlap removed), not the raw additive `24000`.
 
 Creates a linear pattern feature.
 If optional parameters are not set, the default values will be used, see (default=xy).
@@ -1126,6 +1126,8 @@ api.v1.part.linearPattern({ id: part, targets: [feature], dir1: { references: [w
 ## updateLinearPattern(param)
 
 > **AGENT NOTE (trained 2026-03-19):** Requires `openFeature`/`closeFeature` around the update call — without it, returns "feature is not active and open" error. Can update distance, count, references, and merged independently. The `id` param is the linearPattern feature id (not the part id).
+>
+> **AGENT NOTE (trained 2026-03-20):** Successful update returns the linearPattern feature id; failed updates return `null`. You can add `dir2` later via update (create as 1D pattern, then update with `dir2` to convert to 2D grid), and you can replace/update `targets` post-creation. Passing a part id instead of the pattern feature id fails with "not a feature or work geometry id". In failure cases, a secondary message `"id" must be provided for update` may also appear even when `id` was supplied.
 
 Updates a linear pattern feature.
 If optional parameters are not set, the feature will keep the existing values.
diff --git a/references/sketch.md b/references/sketch.md
index 6da1efa..305954d 100644
--- a/references/sketch.md
+++ b/references/sketch.md
@@ -482,6 +482,10 @@ api.v1.sketch.copyFrom({ id: sketch1, toCopyId: sketch2 })
 > - **Constraints created**: Fillet_Coinc (3×: line→controlPt, lineEnd→arcStart, lineStart→arcEnd) + Fillet_Tan (2×: arc tangent to each line)
 > - **undoFillet({id, arcId})**: removes arc + fillet constraints, restores original line endpoints to shared corner position. Returns null (void), lines regain original endpoint positions
 > - **v1.sketch.arc does NOT exist** — "Unknown command v1.sketch.arc" (use arcByThreePoints or arcByCenterStartEnd per docs)
+> - **Double-fillet same corner**: Fails with "Lines don't have incident points!" — after first fillet, lines no longer share a point (arc is between them)
+> - **undoFillet errors**: Wrong ID type → "arcId has a wrong id type! Provide only following id types: ['sketch-arc']"; invalid/nonexistent ID → "An element of parameter 'arcId' has an invalid id!"
+> - **v1.sketch.getConstraints does NOT exist** — constraint inspection requires structure tree traversal
+> - **Full workflow**: fillet all corners → sketchRegion → extrusion works end-to-end (confirmed 2026-03-20, 16 tests)
 
 Creates a fillet in place of a point and its connecting two lines
 
