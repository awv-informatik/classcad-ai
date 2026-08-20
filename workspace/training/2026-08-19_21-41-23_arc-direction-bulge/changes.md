diff --git a/packages/skill/recipes/constrained-sketching.md b/packages/skill/recipes/constrained-sketching.md
index d68561ca..d33c504d 100644
--- a/packages/skill/recipes/constrained-sketching.md
+++ b/packages/skill/recipes/constrained-sketching.md
@@ -22,6 +22,10 @@ bulge faces), and check which sweep contains it — start 90°, end 270°, bulge
 toward −X ⇒ the arc must pass 180° ⇒ counter-clockwise ⇒ `isClockwise:
 false`. A flipped flag silently mirrors the profile.
 
+**An existing arc's direction is immutable** — `updateGeometry` silently ignores
+`isClockwise` (success 31, no change; measured 2026-08-19). Flip = delete + recreate,
+or build with `arcBy3Points` (an on-arc `midPos` pins the sweep, no flag involved).
+
 ## The Method
 
 **Don't hand-compute the layout — and don't assume the drawing is an outline.** Technical
@@ -418,7 +422,10 @@ structure tree and branch on its class:
 - **`CC_Arc`** — derive it from the segment's signed **`bulge`** (`members.bulge.value`, = tan(includedAngle/4))
   and its endpoints `s,e`: `θ = 4·atan(bulge)`, `R = |s−e|/(2·sin(θ/2))`, center = chord-midpoint offset by
   `R·cos(θ/2)` along the chord's left-normal, arc-midpoint at start-angle `+ θ/2`, normal radial. This is the same
-  math the arc renderer uses, and it is **robust for a circle cut any number of times**.
+  math the arc renderer uses, and it is **robust for a circle cut any number of times** — verified 2026-08-19 on
+  8 staged segments incl. a 286° major sub-arc (center/radius recovered to 1e-15; cos(θ/2)'s sign handles >180°).
+  Staged sub-arcs are **CCW-normalized**: positive bulge, endpoints reordered, regardless of the parent
+  circle/arc's direction — read each segment's own bulge + endpoints, never assume the parent's sign survived.
 
 > **Why not the `interval`→angle shortcut?** Mapping a circle-arc `interval` (turn-fraction from the +X seam) to an
 > angle only holds when a circle is cut into exactly **2** arcs. A circle cut 4× (by another circle _and_ a line)
diff --git a/packages/skill/references/sketch/arcBy3Points.md b/packages/skill/references/sketch/arcBy3Points.md
index 6be0ade0..d0349f36 100644
--- a/packages/skill/references/sketch/arcBy3Points.md
+++ b/packages/skill/references/sketch/arcBy3Points.md
@@ -34,6 +34,10 @@ arcBy3Points creates the same `CC_CircularArc` node as `arcByCenter`. The server
 - Same update method (`updateGeometry` with `arcsByCenter` key)
 - Same deletion method (`deleteObject`)
 
+## Direction & bulge
+
+The stored tree bulge (`members.bulge.value` = tan(signedSweep/4), positive = CCW in sketch-local coords) follows from which side `midPos` sits on — measured 2026-08-19: apex-above semicircle → −1.0 (≡ `arcByCenter` cw=true), minor-arc-via-45°-midpoint → +0.4142 (≡ cw=false). Because `midPos` pins the sweep geometrically, arcBy3Points is the **flag-free way to build arcs**: you can't get the complement through direction confusion, only by placing `midPos` on the wrong side. Direction is still fixed at creation (`updateGeometry` ignores `isClockwise`).
+
 ## Return Value
 
 ```js
diff --git a/packages/skill/references/sketch/arcByCenter.md b/packages/skill/references/sketch/arcByCenter.md
index 3ab780ab..75c3a4d8 100644
--- a/packages/skill/references/sketch/arcByCenter.md
+++ b/packages/skill/references/sketch/arcByCenter.md
@@ -13,7 +13,7 @@ Creates one or multiple arcs defined by start, end, and center positions. The ce
 - **`startPos`** (required) — `[x, y, z]`, Z must be 0
 - **`endPos`** (required) — `[x, y, z]`, Z must be 0
 - **`centerPos`** (required) — `[x, y, z]`, Z must be 0. Defines arc radius.
-- **`isClockwise`** (optional, default TRUE) — direction from start to end around center. TRUE = clockwise, FALSE = counterclockwise. CW and CCW with the same points produce complementary arcs (together they'd form a full circle).
+- **`isClockwise`** (optional, **default TRUE**) — sweep direction from start to end around the center, in SKETCH-LOCAL coordinates: TRUE = math-negative (decreasing angle), FALSE = math-positive / CCW (increasing angle). Purely local and identical on all three standard planes — world appearance follows the plane's local→world mapping (measured 2026-08-19, segment-extrusion volume + COG on Top/Front/Right). TRUE and FALSE with the same points produce complementary arcs. COMPUTE the flag from the start/end angles plus one must-pass angle — never intuit it (see recipes/constrained-sketching). Omitting the flag gives the math-negative sweep — a classic source of silently flipped profiles.
 - **`genFixation`** (optional, default TRUE) — auto-generates `CC_2DFixationConstraint` ("Auto_Fix") **only when the center is at origin** (0,0,0). No effect for off-origin centers. Same behavior as point/circle.
 - **`genIncidence`** (optional, default TRUE) — auto-generates `CC_2DCoincidentConstraint` ("Auto_Coinc") when any arc endpoint **exactly matches** an existing point. Works cross-geometry (standalone points, line endpoints, other arc endpoints, circle centers).
 - **`isConstruction`** (optional, default FALSE) — marks the arc as construction/reference geometry (drawn dashed). It participates fully in the constraint solver (e.g. a real curve can be made tangent to it) but is excluded from the profile and from operations: passing construction-only curves to a region op (`part.extrusion`/`part.revolve`/`part.twist`) returns an error (`maxLevel 51`), not a solid. See [constrained-sketching](../../recipes/constrained-sketching.md) (§ Construction geometry).
@@ -22,6 +22,15 @@ Creates one or multiple arcs defined by start, end, and center positions. The ce
 
 **`|startPos - centerPos|` must equal `|endPos - centerPos|`.** Both endpoints must be equidistant from the center. Unequal distances → warning 1014 "Start-, center- and end-pos do not fit together", result is null.
 
+## Direction & bulge (measured 2026-08-19)
+
+- The direction lives ONLY in the structure tree: `CC_CircularArc.members.bulge.value` = **tan(signedSweep/4)** with the sweep signed start→end in sketch-local coords — positive = CCW, negative = clockwise. Examples: CCW quarter +0.4142, CW 270° −2.4142, semicircle ±1.
+- `getPositions` (start/end/center) and `getObjectInfo` (`geometry: {startId, endId, centerId, radius}`) expose **no direction at all** — an arc and its complement are indistinguishable through them. Read the tree bulge.
+- **Direction is fixed at creation** — see Updating below. To flip an arc, delete and recreate it.
+- Swapping start/end while keeping the flag yields the COMPLEMENTARY arc. A mirrored profile traversed in reverse keeps the SAME flag — the mirror flips the sweep, the reversal flips it back (COG measured exactly mirrored).
+- Bulge stays exactly consistent through solver re-solves (radius re-dimensioned 10→15→6: R-from-bulge ≡ R-from-positions to 1e-15). Only known corruption path: the twin-dim unsolvable-intermediate bug (TODO #174).
+- A flipped arc whose two variants enclose equal area (semicircle across its chord: 785.4 mm³ both ways at r=10×h=5) is INVISIBLE to volume checks — the COG side is the discriminating probe (±4.24 = 4R/3π).
+
 ## Batch Creation
 
 Pass an array of param objects:
@@ -88,7 +97,7 @@ await api.v1.sketch.updateGeometry({
 
 **All three positions (startPos, endPos, centerPos) are required.** Omitting any → error 1004. No partial updates.
 
-**`isClockwise` can be changed** via updateGeometry — include it in the update object to flip arc direction.
+**`isClockwise` CANNOT be changed via updateGeometry** — the flag is accepted and silently ignored (maxLevel 31, bulge and geometry unchanged; measured 2026-08-19 with both unchanged and new positions). Position updates preserve the creation-time sweep character (minor stays minor, CW stays CW). To flip direction: `deleteObject` + recreate.
 
 ## Deletion
 
@@ -103,7 +112,8 @@ Returns VOID on success. `getPoints`/`getPositions` on deleted arc returns null
 - **Radius must match** — `|start-center|` must equal `|end-center|`. No tolerance.
 - **getPositions works on arcs** — unlike circles, no two-step workaround needed.
 - **updateGeometry requires all three positions** — cannot update just one endpoint.
-- **isClockwise determines which arc** — same three points, different direction = complementary arcs.
+- **isClockwise determines which arc** — same three points, different direction = complementary arcs; TRUE (the default!) = math-negative sweep in sketch-local coords.
+- **No direction readback outside the tree** — getPositions/getObjectInfo can't tell an arc from its complement; use `members.bulge.value`.
 - **start==end is invalid** — returns ERROR "Invalid arc parameters", not a full circle. Use `sketch.circle` for full circles.
 - **Non-zero Z → error 1014** — same as all sketch geometry.
 - **Minor float noise** — CCW arc centerPos may show tiny float artifacts (e.g., 2.84e-15 instead of 0).
