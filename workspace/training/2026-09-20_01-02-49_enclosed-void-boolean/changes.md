# Skill changes

```diff
diff --git a/packages/skill/recipes/verification.md b/packages/skill/recipes/verification.md
index 7e943f8d..2c4ee0ea 100644
--- a/packages/skill/recipes/verification.md
+++ b/packages/skill/recipes/verification.md
@@ -183,6 +183,8 @@ script from the design math — blank minus holes, etc.). Rules of thumb:
 - Regenerated a parameter → volume must move in the right DIRECTION and
   roughly the right magnitude. Unchanged volume after a "successful" update
   = frozen feature.
+- Unchanged volume after a "successful" SUBTRACTION (maxLevel 31) = the boolean left a sheet
+  body; a section snapshot still looks cut. Assert the expected drop after every subtraction.
 - N patterned cuts → missing instances show up as `+1/N` volume steps.
 - Tolerance: planar solids match exactly; curved solids deviate slightly from the analytic
   value (cylinder ≈ −0.002 %, sphere ≈ +0.014 %) — that is the kernel's volume integration,
diff --git a/packages/skill/references/part/boolean.md b/packages/skill/references/part/boolean.md
index 62dd3988..1f5bc693 100644
--- a/packages/skill/references/part/boolean.md
+++ b/packages/skill/references/part/boolean.md
@@ -39,6 +39,8 @@ After the boolean, target and tool IDs are invalid; reuse → error 1014 `"Entit
   - **`circularPattern` with `merged: 1`**: `@expr`-bound count/angle stay fully live through the subtraction (tooth count 21→24 regenerated the subtracted body exactly). With `merged: 0` a consumed pattern does not regenerate correctly (count 4→6 reported success and left the target uncut) — **always merge patterns that feed booleans**.
   - `@expr`-bound params of consumed primitives regenerate correctly in a single subtraction (part.cylinder `diameter: '@expr.D'`, D 10→20: volume and hole position exact). One complex sprocket model with patterns and several booleans regenerated a consumed cylinder wrongly (hole moved, ¼ of the expected material change, maxLevel 31) — in long boolean chains, verify volume after parameter updates.
   - **Downstream edge-referenced features TRACK the regen**: a `part.chamfer` (tree tip) on the 1.0"-bore rims followed a sketch-dim regen to a 1.25" bore exactly (chamfer ring at the new radius, error 0 mm) — brep-id-based references survive sketch-driven topology regeneration.
+- **A fully enclosed tool is fine — the result is one solid with a void.** Subtracting a tool that lies entirely inside the target (hollowing a closed body) gives ONE solid with two shells; the volume is exactly target − tool, and chamfer, union, further subtractions (including bores that open the void) and a slice straight through the void all work on it. STEP export keeps it as one solid with an outer and a reversed inner shell. No need to open the body first.
+- **⚠️ A SUBTRACTION can succeed (maxLevel 31, new feature id) and return a SHEET body instead of a solid.** Seen on a multi-feature shell (sliced target with unioned bosses, sliced tool): the faces are cut correctly, so a section snapshot LOOKS right, but the shells are not assembled into a solid. Signature: `calculateMassProperties` reports the target's volume unchanged; a STEP export contains no solid; the next mass-properties call fails with `GetVolumeAndCOG: Division by zero!` and the next boolean with `The body used for Subtraction … is a Sheet, please select a solid`. It is geometry-dependent, not a rule about the operation: moving one unioned boss 0.5 mm, changing one unrelated chamfer by 0.8 mm, or slicing the target open before the subtraction each gave a correct solid from the same recipe. **After every subtraction assert the volume dropped by the tool's overlap** — an unchanged volume is a failed boolean, whatever maxLevel says; then perturb a dimension or reorder so the cut meets an open face.
 - **Many tools in one call is fine** — one SUBTRACTION with 7 tools (pattern + revolves + cylinder + extrusions) works; one consumption chain beats sequential booleans for tool-heavy builds.
 - **One root part per drawing.** A second `part.create` is refused ("There is already a root assembly or part"); `common.clear()` first, or use part templates in an assembly.
 
@@ -50,6 +52,7 @@ After the boolean, target and tool IDs are invalid; reuse → error 1014 `"Entit
 | `"An element of parameter \"tools\" has an invalid id!"` | 1006 | Non-existent tool ID | Verify tool IDs |
 | `"The provided part id does not exist."` | 1006 | Invalid `id` | Pass the correct part ID |
 | `"The type \"0\" is not supported in PrepareAPIParams!"` | 1004 | Empty tools `[]` (an error, not a no-op) | Provide at least one tool |
+| `"The body used for Subtraction (CC_Subtraction) is a Sheet, please select a solid."` | — | The TARGET is a sheet body left by an earlier boolean that reported success (see Gotchas) | Check the volume after each subtraction; fix the earlier one |
 
 ## Working Example
 
diff --git a/packages/skill/references/part/calculateMassProperties.md b/packages/skill/references/part/calculateMassProperties.md
index f0ac44e6..ed7d637a 100644
--- a/packages/skill/references/part/calculateMassProperties.md
+++ b/packages/skill/references/part/calculateMassProperties.md
@@ -39,6 +39,8 @@ Calculates center of gravity (COG) and volume of a part, assembly, instance, or
 
 - **Feature IDs don't work** — most common mistake. Pass the part ID, not the ID returned by `part.box()` etc. Error: `"The parameter 'id' has a wrong id type! Provide only following id types: ['part/assembly','instance','solid']"`
 - **Empty parts crash** — a part with no solid returns an internal NullMem server error, not a graceful zero volume. Ensure geometry exists first.
+- **Enclosed voids are measured correctly** — a solid with an inner void shell reports outer − void (box 100×60×40 with an enclosed 80×40×20 void: exactly 176000).
+- **Unchanged volume after a subtraction = the boolean left a sheet body**, not a measurement glitch: the call still answers with the pre-cut volume once, and the next call fails with `GetVolumeAndCOG: Division by zero!` plus a NullMem type error. See `boolean.md` → Gotchas.
 - **Cone top diameter must be > 0** — `tDiameter: 0` is rejected at creation ("Value for top diameter must be greater than 0"). `0.001` works (volume within 0.0004% of the pointed cone).
 
 ## Common Errors
@@ -48,6 +50,7 @@ Calculates center of gravity (COG) and volume of a part, assembly, instance, or
 | "wrong id type" | 1001 | Feature, sketch, work geometry, or entity injection ID |
 | "invalid id" | 1006 | ID doesn't exist |
 | NullMem evaluation error | 0 | Empty part (no solid) |
+| `GetVolumeAndCOG: Division by zero!` + NullMem type error | 0 | The part holds a sheet body from a boolean that reported success |
 
 ## Working Example
 
```
