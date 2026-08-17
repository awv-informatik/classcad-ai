# Training: sketch.setWorkPlane

**Date:** 2026-04-08

## Goal

Deep-dive on `v1.sketch.setWorkPlane` — reassigning a sketch to a different work plane after creation.

**Methods to cover:**

- `setWorkPlane` — basic reassignment to a USERDEFINED work plane
- `setWorkPlane` — reassignment to work planes with different normals/positions
- `setWorkPlane` — effect on existing sketch geometry (lines, rectangles drawn before reassignment)
- `setWorkPlane` — reassignment to standard planes (XY/XZ/YZ)
- `setWorkPlane` — double reassignment (move sketch twice)
- `setWorkPlane` — multiple sketches sharing the same plane
- `setWorkPlane` — error: face ID instead of work plane ID
- `setWorkPlane` — error: invalid/non-existent ID
- `setWorkPlane` — error: sketch ID or part ID as planeId
- `setWorkPlane` — verify structure tree changes after reassignment
- `setWorkPlane` — interaction with sketch geometry coordinate system

**Questions:**

- Does reassignment affect existing sketch geometry positions?
- Does the sketch coordinate system change when reassigned?
- Can you reassign back to the original plane?
- What happens to the structure tree (planeReference member)?
- Does setWorkPlane work on a sketch that has geometry in it?
- Can you use a PLANE-type work plane (referenced to another plane)?

---

## 01 — basic reassignment

Script: `scripts/01-basic-reassign.mjs` — ✅ Works as documented.

**Data:** Result=null (VOID), maxLevel=31, messages=[]. Structure tree changes:
- `planeReference` member changes from 0 (default XY) to work plane ID (60)
- `coordinateSystem` changes: origin moves from `[0,0,0]` to `[0,50,0]` (the work plane's position)
- Axes update to match the plane orientation: Y-axis `[0,1,0]`→`[0,0,-1]`, Z-axis `[0,0,1]`→`[0,1,0]`

**📌 LLM doc:** Document VOID return, maxLevel=31, planeReference change, coordinateSystem update.

## 02 — with existing geometry

Script: `scripts/02-with-geometry.mjs` — ✅ Geometry survives reassignment.

Sketch with a rectangle moved from XY (coordSys origin `[0,0,0]`) to a Z=100 plane (coordSys origin `[0,0,100]`). Geometry children (21 nodes) preserved. The rectangle's local coordinates remain the same; its world-space position changes because the plane moved.

**📌 LLM doc:** Geometry survives setWorkPlane — local coordinates are preserved, world-space changes.

## 03 — double reassignment

Script: `scripts/03-double-reassign.mjs` — ✅ Multiple reassignments work.

A→B→A pattern works. planeReference correctly tracks the current plane. However, **coordinateSystem origin accumulates** — see script 11 for deep investigation.

## 04 — face ID error

Script: `scripts/04-face-id-error.mjs` — ✅ As documented, face IDs rejected.

maxLevel=51, code=1001, message: `"The parameter \"planeId\" has a wrong id type! Provide only following id types: [\"workplane\"]"`.

**📌 LLM doc:** Already documented. Verified — error code 1001.

## 05 — invalid ID error cases

Script: `scripts/05-invalid-ids.mjs` — ✅ All error cases documented.

| Input | maxLevel | Code | Message |
|-------|----------|------|---------|
| Non-existent ID (99999) | 51 | 1006 | "ToId()/TOID() didn't get an existing or valid id." |
| Self-reference (sketch ID) | 51 | 1001 | "wrong id type" — only workplane accepted |
| Part ID | 51 | 1001 | "wrong id type" |
| Missing planeId | 51 | 1004 | "planeId must be provided" |
| Invalid sketch ID | 51 | 1006 | "didn't get an existing or valid id" |

**📌 LLM doc:** Add missing planeId error (code 1004) and invalid sketch ID error.

## 06 — multiple sketches same plane

Script: `scripts/06-multiple-sketches-same-plane.mjs` — ✅ Both sketches reference same plane.

Both sketches get planeReference=66 (the shared work plane ID). Identical coordinate systems. No conflicts.

## 07 — standard work planes

Script: `scripts/07-std-workplanes.mjs` — ✅ Standard planes work with setWorkPlane.

Parts come with 3 standard work planes: **Top** (id=38, XY), **Front** (id=42, XZ), **Right** (id=46, YZ).

Coordinate systems after assignment:
- **Top**: `[[0,0,0],[1,0,0],[0,1,0],[0,0,1]]` — XY plane
- **Front**: `[[0,0,0],[1,0,0],[0,0,-1],[0,1,0]]` — XZ plane (Y→-Z, Z→Y)
- **Right**: `[[0,0,0],[0,1,0],[0,0,1],[1,0,0]]` — YZ plane (X→Y, Y→Z, Z→X)

**📌 LLM doc:** Standard work planes can be used. Document their names, typical IDs, and coordinate mappings.

## 08 — offset work plane

Script: `scripts/08-offset-plane.mjs` — ✅ Offset applied to origin.

Work plane with normal=[0,0,1], position=[0,0,0], offset=50 → sketch coordSys origin at `[0,0,50]`. The offset is applied in the normal direction.

## 09 — reassign back to "default"

Script: `scripts/09-reassign-back-to-default.mjs` — ✅ Can move back, but planeReference is never 0 again.

After creating an XY work plane at origin and assigning the sketch to it, planeReference becomes the new plane's ID — not 0. The sketch is functionally back on the XY plane but explicitly referenced.

**📌 LLM doc:** Cannot restore planeReference=0 (the implicit default) via setWorkPlane. Must create an explicit XY work plane.

## 10 — geometry position in world space

Script: `scripts/10-geometry-positions.mjs` — ✅ As expected.

Line drawn at local (10,20,0)→(50,40,0). After moving to z=100 plane, coordSys origin = `[0,0,100]`. Local coordinates preserved. World-space would be (10,20,100)→(50,40,100).

## 11 — coordinate system origin accumulation (KEY FINDING)

Script: `scripts/11-coordsys-accumulate.mjs` — ⚠️ Origin accumulates across reassignments!

| Step | Plane | Origin |
|------|-------|--------|
| Initial | Default XY | `[0,0,0]` |
| Move to A (normal=[1,0,0], pos=[30,0,0]) | YZ at x=30 | `[30,0,0]` |
| Move to B (normal=[0,0,1], pos=[0,0,40]) | XY at z=40 | `[30,0,40]` ← X=30 preserved! |
| Move back to A | YZ at x=30 | `[30,0,40]` ← Z=40 preserved! |

**Confirmed by script 16:** A fresh sketch placed directly on plane B would have origin `[20,0,0]`, but a sketch moved from A (y=50) to B gets origin `[20,50,0]` — the Y=50 from the previous plane is **kept**.

**Mechanism:** When setWorkPlane moves a sketch, it applies the new plane's position in its normal direction but **preserves the sketch's existing position in orthogonal directions**. This means repeated reassignments can accumulate offsets.

**📌 LLM doc:** Major gotcha — document origin accumulation behavior. Recommend creating a fresh sketch on the target plane if a clean origin is needed.

## 12 — PLANE-type referenced work plane

Script: `scripts/12-plane-type-referenced.mjs` — ✅ Works.

A PLANE-type work plane referencing a base XY plane with offset=80 → sketch coordSys origin at `[0,0,80]`. The resolved position of the referenced plane is used correctly.

## 13 — idempotent (same plane)

Script: `scripts/13-set-same-plane.mjs` — ✅ No change.

Setting setWorkPlane to the plane the sketch is already on: planeReference unchanged, coordinateSystem unchanged. maxLevel=31. No side effects.

## 14 — tilted (non-axis-aligned) plane

Script: `scripts/14-tilted-plane.mjs` — ✅ Works.

Normal `[0,1,1]` (unnormalized) → ClassCAD normalizes to `[0,0.707,0.707]`. CoordSys axes: X=`[1,0,0]`, Y=`[0,0.707,-0.707]`, Z=`[0,0.707,0.707]`. Sketch geometry (rectangle) works on tilted planes.

## 15 — work plane node inspection

Script: `scripts/15-workplane-members.mjs` — ✅ Informational.

CC_WorkPlane node members: Offset, Normal, Size(200), Inverted, Angle, curPosition (includes offset), Type(3=USERDEFINED), Position, References. The `curPosition` is `Position + Offset * Normal`.

Standard work planes (Top/Front/Right) don't have coordinateSystem on the node itself — it's derived.

## 16 — origin behavior deep-dive

Script: `scripts/16-origin-behavior.mjs` — ✅ Confirms accumulation pattern.

Fresh sketch on wp2 (pos=[20,0,0]): origin=`[20,0,0]`. Sketch moved from wp1 (pos=[0,50,0]) to wp2: origin=`[20,50,0]`. The Y=50 from wp1 persists. See script 11 notes for full analysis.

## 17 — sketch with constraints

Script: `scripts/17-sketch-with-constraints.mjs` — ✅ setWorkPlane succeeds.

PERPENDICULAR constraint creation failed (maxLevel=51 — likely wrong reference format), but the sketch with two lines moved successfully. Children count=7 after move.

## 18 — extrusion dependency

Script: `scripts/18-extrusion-dependency.mjs` — Partial: sketchRegion failed (no closed region from raw rectangle), so extrusion wasn't created. setWorkPlane itself succeeded (maxLevel=31).

---

## Coverage Checklist

- [x] API called successfully (scripts 01-03, 06-14, 16-18)
- [x] Every required parameter tested (id, planeId)
- [x] Error cases exercised (scripts 04, 05)
- [x] Work plane types: USERDEFINED (01-03), PLANE-referenced (12), standard (07), offset (08), tilted (14)
- [x] Behavioral claims verified with data (structure tree diffs, coordinate system comparisons)
- [x] Origin accumulation gotcha discovered and verified (scripts 11, 16)
- [x] Idempotent behavior verified (script 13)
- [x] Geometry survival verified (scripts 02, 10, 14)
- [x] Multiple sketches on same plane (script 06)
- [x] Double reassignment (scripts 03, 11)
