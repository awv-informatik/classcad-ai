# Skill changes — variant B session

## Side quest: @expr-in-dimensions doc correction (committed d1df8b3)

```diff
diff --git a/references/SKETCHING.md b/references/SKETCHING.md
index 17bf343..b293858 100644
--- a/references/SKETCHING.md
+++ b/references/SKETCHING.md
@@ -188,7 +188,7 @@ Constraints and dimensions are ACTIVE. On a `planeId` sketch the solver enforces
 
 1. **Anchor the datum** — `FIXATION` on reference geometry first; without an anchor the solver chooses what to move. Place the datum point EXACTLY at its drawing coordinates before fixing — FIXATION freezes the current position, it doesn't know where the point "should" be. One exactly-placed fixed point per sketch is enough; everything else can be seeded rough. To lock a line completely, fix its two **endpoints** individually: FIXATION on the line itself locks position/direction but NOT length — the solver will happily stretch a "fixed" line to satisfy a COINCIDENT or EQUAL_LENGTH elsewhere (verified).
 2. **Relate** — COINCIDENT (connect), TANGENT (tangency), CONCENTRIC, PARALLEL / PERPENDICULAR, HORIZONTAL / VERTICAL, SYMMETRY (axis FIRST in geomIds). Full tables in `sketch/constraint.md`.
-3. **Dimension** — drive sizes/distances to the drawing's values. `value` at creation WORKS; omit `value` to lock the current measurement instead. Formulas (`'60+10'`) work; angles need the `'45deg'` suffix; `@expr.NAME` is NOT supported in dimensions.
+3. **Dimension** — drive sizes/distances to the drawing's values. `value` at creation WORKS; omit `value` to lock the current measurement instead. Formulas (`'60+10'`) work; angles need the `'45deg'` suffix; `@expr.NAME` binds linear/radial dims to expressions LIVE (updateExpression → sketch re-solves; verified 2026-08-10 — an earlier "not supported" claim here came from a malformed-expression-call test artifact; ANGLE dims still reject @expr).
 
 ### One annotation = one dimension entity
 
diff --git a/references/part/expression.md b/references/part/expression.md
index c1e604f..6697d35 100644
--- a/references/part/expression.md
+++ b/references/part/expression.md
@@ -32,6 +32,14 @@ The `param` argument accepts both a single object and an array of objects (each
 
 ## Gotchas
 
+- **⚠️ The direct `{id, name, value}` form is a SILENT NO-OP that LOOKS successful.**
+  `part.expression({id, name: 'W', value: 40})` (without `toCreate`) returns result=1,
+  maxLevel=31 — and creates NOTHING (`getExpression('W')` → value null). This footgun produced a
+  long-lived false skill finding: 2026-04-14 tests "proving" that `@expr` doesn't work in sketch
+  dimensions had created their expression this way, so every `@expr` reference pointed at a
+  nonexistent expression (error 51 "Couldn't set the value for dimension") — reproduced end-to-end
+  2026-08-10 (sprocket-parametric-B/01d). Always use `toCreate: [...]` and, when a downstream
+  `@expr` mysteriously fails, check `getExpression` FIRST.
 - **Duplicate name → error 1014, result=0.** The original value is preserved. Use `updateExpression` to change an existing expression's value.
 - **Invalid formulas with bad runtime refs (undefined variables) ARE registered** despite result=0. The expression exists in the ExpressionSet with a default value of 1 and a broken formula. You must `deleteExpression` or `updateExpression` to fix it — re-creating with the same name gives "already exists".
 - **Syntax errors in a batch are atomic** — if any item in `toCreate` has a syntax error (e.g., `'2++3'`), the ENTIRE batch fails and no expressions are created. This differs from runtime ref errors where the expression gets registered.
diff --git a/references/sketch/dimension.md b/references/sketch/dimension.md
index 678c661..d958fe3 100644
--- a/references/sketch/dimension.md
+++ b/references/sketch/dimension.md
@@ -20,7 +20,7 @@ Creates dimensional constraints in a sketch. Dimensions are active constraints 
   - Numbers: `50`, `3.14`
   - Formula strings: `'60+10'`, `'sqrt(2)*50'`
   - Angle strings with `deg` suffix: `'60deg'`, `'45deg'`
-  - **`@expr.NAME` does NOT work** in this param. It also does NOT work in `updateDimension`. Expression binding is not supported for dimensions — use `updateDimension` with computed numeric values instead.
+  - **`@expr.NAME` WORKS and binds LIVE** (verified 2026-08-10 on OFFSET and RADIUS; ANGLE fails with maxLevel 51). `value: '@expr.W'` sets the dim from the expression AND keeps tracking it — a later `updateExpression` re-solves the sketch immediately, no recalc. The referenced expression MUST exist (`toCreate` form!) — a missing name errors 51 "Couldn't set the value for dimension". Formula strings referencing expressions (`'W*2'`), bare names, and `$NAME` still fail.
 - **`name`** (optional) — custom name for the dimension in the structure tree. Default auto-names vary by type.
 - **`dimPos`** (optional) — `[x, y, 0]` position for the dimension text. For ANGLE, also selects which angular sector to constrain.
 - **`reflex`** (optional, ANGLE only) — `true` to constrain the outer angle (>180°). Default `false`.
@@ -66,7 +66,7 @@ const ids = (await api.v1.sketch.dimension([
 - **Auto-value (omit `value`)** locks the current measurement without resizing. The dimension constrains the geometry to its current size/angle.
 - **Fix an anchor first.** Without a FIXATION constraint, the solver may move geometry in unexpected ways. Always fix at least one reference point.
 - **Formulas work:** `'60+10'`, `'sqrt(2)*50'`, `'45deg'`. Evaluated at creation time.
-- **`@expr.NAME` does NOT work** in the `value` parameter. The dimension is created but with maxLevel=51 and geometry is not resized. Expression binding is not supported for dimensions at all — neither at creation nor via `updateDimension`. Use `updateDimension` with computed numeric values instead.
+- **`@expr.NAME` in `value` binds the dimension to the expression, LIVE** (verified 2026-08-10: OFFSET and RADIUS bound at creation and followed `updateExpression` immediately; also works via `updateDimension`). **ANGLE dims reject @expr** (maxLevel 51). ⚠️ History: this doc previously claimed @expr "does not work" — that finding (2026-04-14) was an artifact: the test created its expression with the malformed direct form `part.expression({id, name, value})`, which silently no-ops (result=1, maxLevel=31!), so `@expr` pointed at a NONEXISTENT expression and errored 51. Reproduced 2026-08-10 (sprocket-parametric-B/01d). Always create expressions with `toCreate: [...]` and verify via `getExpression` before binding.
 
 ## Gotchas
 
@@ -132,7 +132,7 @@ const dims = (await api.v1.sketch.dimension([
 
 ## Related
 
-- `sketch.updateDimension` — change dimension value after creation (numeric values and formula strings only — NOT `@expr.NAME`)
+- `sketch.updateDimension` — change dimension value after creation (numbers, formula strings, or `@expr.NAME` live bindings)
 - `sketch.updateDimensionPosition` — move dimension text position
 - `sketch.constraint` — geometric constraints (non-dimensional)
 - `sketch.deleteObject` — delete a dimension (`ids: [dimId]`)
diff --git a/references/sketch/updateDimension.md b/references/sketch/updateDimension.md
index cd6b7e9..82c6315 100644
--- a/references/sketch/updateDimension.md
+++ b/references/sketch/updateDimension.md
@@ -14,7 +14,7 @@ Updates a dimension's value and re-solves the sketch. The solver immediately rep
   - **Numbers:** `50`, `3.14`, `0`
   - **Formula strings:** `'50+70'`, `'sqrt(2)*50'`, `'100'`
   - **Angle strings:** `'30deg'`, `'60deg'` (for ANGLE/ANGLEOX dimensions)
-  - **NOT expressions:** `@expr.NAME` does NOT work (fails silently with result=0). Neither does bare expression names, `$NAME`, or formula strings referencing expressions. See Gotchas.
+  - **Live expression bindings:** `'@expr.NAME'` — binds the dim to the expression (result 2) and keeps tracking it: a later `updateExpression` re-solves the sketch immediately (verified 2026-08-10). The expression must EXIST — see Gotchas. Bare expression names, `$NAME`, and formula strings referencing expressions still fail (result=0).
 
 ## Return Value
 
@@ -52,7 +52,7 @@ Updates a dimension's value and re-solves the sketch. The solver immediately rep
 
 ## Gotchas
 
-- **Expression binding does NOT work for dimensions.** The API docs show `value: '@expr.distance1'` but this fails silently (result=0, no error, geometry unchanged). Neither `@expr.NAME`, bare expression names, `$NAME`, nor formula strings referencing expressions work. `linkWithExpression` also fails — dimensions have no linkable `value` member in their structure tree. To drive dimensions parametrically, you must call `updateDimension` with computed numeric values.
+- **Expression binding WORKS via `value: '@expr.NAME'` — and is LIVE** (verified 2026-08-10: bind via updateDimension → result 2; subsequent `updateExpression` moved the geometry with no further calls). Requirements & limits: the expression must exist (create with `part.expression({toCreate: [...]})` — the direct `{id,name,value}` form is a SILENT NO-OP returning result=1, which is exactly how the old "does not work" finding here was produced: its @expr pointed at a never-created expression, verified+reproduced 2026-08-10, sprocket-parametric-B/01d). `linkWithExpression` on a dimension still fails ("Datamember ... not found") — `@expr` in `value` IS the binding path. Bare names, `$NAME`, and expression-referencing formula strings still fail (result=0). ANGLE/ANGLEOX + @expr fails (maxLevel 51) — use numeric `'NNdeg'` strings there.
 - **Return value is NOT boolean.** The API docs say `result: boolean` but actual values are 0, 1, or 2 (solver state enum). Use `result > 0` to check success.
 - **Negative values fail silently.** result=0, no error messages, but geometry may partially change to `|value|`. Avoid negative values.
 - **Zero is valid.** Collapses geometry to zero length/radius (result=2).
```

## Variant-B core findings (committed ac75fb4)

```diff
diff --git a/references/part/boolean.md b/references/part/boolean.md
index b2ad2dd..c456eb9 100644
--- a/references/part/boolean.md
+++ b/references/part/boolean.md
@@ -53,6 +53,17 @@ const subId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', targ
   original instance). The 1014 message **names the wrong entity** (some other tool in the array or
   the pattern itself, e.g. "SetScrew2"/"Pat"), not the consumed one — verified 2026-08-10. With many
   tools, check for pattern-target overlaps before trusting the named entity.
+- **⚠️ Consumed tools are parametrically DEAD at the feature level — but ALIVE at the sketch level**
+  (verified 2026-08-10, sprocket-parametric-B). After a boolean consumes tools:
+  - sketch-dimension edits (numeric `updateDimension` or live `@expr` bindings) on the tools'
+    sketches **regenerate the boolean result exactly** — this is the supported parametric path;
+  - `@expr`-bound FEATURE params of consumed tools silently freeze (circularPattern count/angle)
+    or CORRUPT the result (part.cylinder diameter: hole teleported, exactly ¼ of the expected
+    material change, maxLevel 31 throughout);
+  - explicit `openFeature`+`updateCircularPattern`+`closeFeature` on a consumed pattern reports
+    full success and **changes nothing**.
+  Design rule: route every parameter you want live through a sketch dimension; treat feature
+  params (pattern count!) as frozen at consumption time — count changes require a rebuild.
 - **Many tools in one call is fine.** A single SUBTRACTION with 7 tools (pattern + revolves +
   cylinder + extrusions) works — one consumption chain beats sequential booleans for tool-heavy
   builds (verified 2026-08-10, sprocket generator).
diff --git a/references/part/circularPattern.md b/references/part/circularPattern.md
index e9de63f..6bc00ca 100644
--- a/references/part/circularPattern.md
+++ b/references/part/circularPattern.md
@@ -33,6 +33,12 @@ Feature ID (numeric) on success, maxLevel=31 (info). Returns the feature ID even
   `tools: [patternId]` cuts all N instances; `tools: [toolId, patternId]` fails with error 1014
   "already been consumed", and the message **names an arbitrary other tool** (e.g. a later,
   perfectly valid one), not the offending consumed target — highly misleading when debugging.
+- **Count/angle FREEZE at boolean consumption** (verified 2026-08-10): once the pattern is used as
+  a boolean tool, `@expr`-bound count/angle stop tracking their expressions, and even explicit
+  `openFeature`+`updateCircularPattern`+`closeFeature` reports success (maxLevel 31, id returned)
+  while changing NOTHING. The pattern's SEED shape stays live (sketch-dim edits propagate into
+  every copy), only the count/spacing are dead. Tooth-count-style parameters are rebuild
+  parameters, not model parameters.
 - **`angle=0` does NOT mean equal spacing.** It means literally 0° between copies — all instances stack at the same position. For equal spacing around a full circle, calculate: `angle = 2 * Math.PI / count` (or `'2*C:PI/count'` as expression).
 - **`count` includes the original.** count=4 means 4 total bodies, not 4 copies. count=1 creates the feature but adds no copies.
 - **`merged: 1` fails** with "Boolean operation failed with error 1001" for circularPattern. The feature is created and copies are placed, but the boolean union step fails. Bodies remain separate. Use `part.boolean` with `type: 'UNION'` after creation as a workaround.
diff --git a/references/part/expression-workflow.md b/references/part/expression-workflow.md
index 68cf51f..7cca3c2 100644
--- a/references/part/expression-workflow.md
+++ b/references/part/expression-workflow.md
@@ -141,6 +141,14 @@ await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value:
 
 ## Gotchas
 
+- **⚠️ @expr feature-param bindings DIE (or corrupt) when the feature is consumed by a boolean**
+  (verified 2026-08-10, sprocket-parametric-B): a consumed `part.cylinder` with
+  `diameter:'@expr.D'` produced a corrupted partial regen on update (hole teleported, ¼ of the
+  expected volume change, maxLevel 31); a consumed `circularPattern` with @expr count/angle froze
+  silently. **Sketch DIMENSIONS with @expr bindings keep working through consumption** — route
+  live parameters through sketches. See `part/boolean.md` for the full matrix.
+- **@expr also works in sketch dimension values** (LIVE — see `sketch/dimension.md`); ANGLE dims
+  are the exception.
 - **Deleting a linked expression does NOT destroy the feature.** The parameter freezes at the expression's last value (same as unlink). No warning is emitted.
 - **Renaming a linked expression BREAKS the binding.** Features that referenced the old name via @expr freeze at the last value. The feature does NOT auto-update to the new name. No warning. If you rename, you must re-link features afterward.
 - **Inline formulas are dead strings.** `height: '30 + 30'` is evaluated once at creation and never updated. Use @expr for live bindings.
diff --git a/references/sketch/dimension.md b/references/sketch/dimension.md
index d958fe3..85d6531 100644
--- a/references/sketch/dimension.md
+++ b/references/sketch/dimension.md
@@ -76,6 +76,15 @@ const ids = (await api.v1.sketch.dimension([
   2026-07-02 on a 21-dim batch; not isolated to a single type). Safe route: create all
   dimensions WITHOUT `dimPos`, then place text with `updateDimensionPosition` — that works on
   every type. (`dimPos` for ANGLE sector selection is a different, documented use.)
+- **HD/VD point-pair dims are UNSIGNED and branch-keeping** (probed 2026-08-10): geomIds order is
+  irrelevant, `value` is an absolute distance, and the solver keeps the SEED's side (up/down,
+  left/right) — even when the seed is far off. Consequence: the side of a feature is encoded ONLY
+  by the seed, and a LARGE driving-value jump (e.g. a cascade that moves the anchor further than
+  the local feature scale) can legitimately re-solve onto the MIRROR branch — all constraints
+  satisfied, lgsState 1, updateDimension result 2, geometry on the wrong side. Verified on the
+  ANSI tooth sketch: teeth 21→24 in one update flipped the working-arc centers below their anchor;
+  **stepping the parameter (21→22→23→24) kept the correct branch with float-exact results**.
+  Mitigate by stepping large parameter changes, or add side-encoding constraints.
 - **DIAMETER value is diameter, not radius.** `value: 60` on a circle means radius=30.
 - **ANGLE value needs `deg` suffix.** Use `'60deg'` not `60`. Without the suffix, the value is interpreted as radians.
 - **Negative values create broken dimensions.** A negative OFFSET value creates the dimension (gets an ID) but fails to set the value (maxLevel=51). The dimension exists in a broken state.
diff --git a/references/sketch/getPositions.md b/references/sketch/getPositions.md
index a7af30a..0458b5b 100644
--- a/references/sketch/getPositions.md
+++ b/references/sketch/getPositions.md
@@ -23,6 +23,12 @@ All positions are `{ x, y, z }` named objects, NOT `[x, y, z]` arrays. maxLevel=
 
 ## Gotchas
 
+- **⚠️ Positions are WORLD coordinates, not sketch-local** (verified 2026-08-10, sprocket-parametric-B).
+  On a Right-plane sketch, local (lx, ly) comes back as world `{x: 0, y: −ly, z: lx}`. All earlier
+  training read Top-plane sketches where local == world, so this went unnoticed. When verifying
+  solver results on Front/Right (or custom) planes, map through the plane basis first (probed
+  bases: Top localXY→XY/+Z; Front x→+X, y→−Z, n→+Y; Right x→+Z, y→−Y, n→+X) — a "solver failure"
+  with uniform large errors on a non-Top plane is usually THIS.
 - **Circles do NOT work.** Despite the docs claiming circle returns `{ centerPos }`, calling `getPositions` on a circle ID produces error: `[Evaluation error in SketchAPI_v1.getPositions::PROC:[CCVM::lcm: objId not found]]`. Use `getPoints(circleId)` → `getPositions(centerId)` as workaround.
 - **Floating-point noise on arc centers.** Computed positions (especially arc `centerPos`) may have epsilon-level noise (e.g., `-4.44e-16` instead of `0`). This is standard kernel behavior.
 - **No `midPos` for arcBy3Points.** Both arc creation methods produce the same output: `{ startPos, endPos, centerPos }`. The midpoint from `arcBy3Points` creation is not preserved.
```

## Complete-model addendum (committed ec164ff)

```diff
diff --git a/references/part/boolean.md b/references/part/boolean.md
index c456eb9..8f64f95 100644
--- a/references/part/boolean.md
+++ b/references/part/boolean.md
@@ -64,6 +64,10 @@ const subId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', targ
     full success and **changes nothing**.
   Design rule: route every parameter you want live through a sketch dimension; treat feature
   params (pattern count!) as frozen at consumption time — count changes require a rebuild.
+  - **downstream edge-referenced features TRACK the regen**: a `part.chamfer` (tree tip) whose
+    edge refs were collected on the 1.0"-bore rims followed a sketch-dim regen to a 1.25" bore
+    exactly (chamfer ring at the new radius, error 0 mm; verified 2026-08-10) — brep-id-based
+    references survive sketch-driven topology regeneration.
 - **Many tools in one call is fine.** A single SUBTRACTION with 7 tools (pattern + revolves +
   cylinder + extrusions) works — one consumption chain beats sequential booleans for tool-heavy
   builds (verified 2026-08-10, sprocket generator).
diff --git a/references/sketch/create.md b/references/sketch/create.md
index 7f06d05..0f982ce 100644
--- a/references/sketch/create.md
+++ b/references/sketch/create.md
@@ -60,7 +60,13 @@ const skId = (await api.v1.sketch.create({ id: partId })).result
 
 ## Gotchas
 
-- **Without `planeId`, the constraint solver is off.** See section above.
+- **Without `planeId`, the constraint solver is off.** See section above. **Error signature:**
+  on a planeless sketch, `sketch.dimension`/`updateDimension` with a `value` fail with
+  maxLevel 51 `"Couldn't set the value for dimension $N"` — for @expr AND plain numeric values
+  alike. If you see this on a sketch that "should" have a plane, verify the planeId you passed
+  actually resolved (a `planes['Front']` lookup on a map that lacks the key passes `undefined`
+  SILENTLY — `sketch.create` returns maxLevel 31 and a valid-looking id; cost 2h of solver-state
+  ghost-hunting, 2026-08-10 sprocket-parametric-B).
 - **Duplicate names are silent.** No error, no warning. The second sketch with the same name just gets a different ID. `part.getSketch` returns the **first** match only — so duplicates make later sketches unreachable by name.
 - **`sketch.create` vs `part.sketch`** — these are the same API with identical params and behavior. Both live in different namespaces but do the same thing.
 - **Default plane is XY.** When `planeId` is omitted, the sketch lives on the XY plane at origin. The `planeReference` member is 0 (no explicit reference).
```
