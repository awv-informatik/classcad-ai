# Training: part.workPoint

**Date:** 2026-03-30

## Goal

Testing `v1.part.workPoint` — 8 types.

**Coverage checklist:**

- [x] USERDEFINED defaults + custom position
- [x] BREPVERTEX with brep vertex
- [x] EDGEMIDPOINT with brep edge
- [x] CENTER with sketch circle
- [x] BARYCENTER with brep face
- [x] INTERSECTION with 2 edges
- [x] 2POINTS with 2 vertices
- [x] INNERCIRCLE with 3 sketch lines
- [x] Expression strings in position
- [x] Name duplicates
- [x] Error cases
- [x] Built-in work points check

---

## 01 — USERDEFINED

Script: `scripts/01-defaults.mjs` — ✅ defaults, custom position, negative all work.

---

## 02 — BREPVERTEX

Script: `scripts/02-brepvertex.mjs` — ✅/❌

- Brep vertex: ✅ maxLevel=31
- Work point ID as reference: ❌ "wrong id type! Provide only following id types: [\"sketch-point\",\"vertex\"]"

**📌 LLM doc:** BREPVERTEX only accepts sketch-point and vertex types. Not work point IDs.

---

## 03 — EDGEMIDPOINT

Script: `scripts/03-edgemidpoint.mjs` — ✅ maxLevel=31 with brep edge.

---

## 04 — BARYCENTER

Script: `scripts/04-barycenter.mjs` — ✅/❌

- Brep face: ✅ maxLevel=31
- Work plane: ❌ "wrong id type! Provide only following id types: [\"face-plane\"]"

**📌 LLM doc:** BARYCENTER only accepts face-plane (brep face). Despite docs saying "brep-face or work-plane", work plane IDs are rejected.

---

## 05 — INTERSECTION

Script: `scripts/05-intersection.mjs` — ✅ maxLevel=31 with 2 brep edges.

---

## 06 — 2POINTS

Script: `scripts/06-2points.mjs` — ✅ both work.

- Two distinct vertices: ✅
- Same point twice: ✅ maxLevel=31 — unlike workAxis.2POINTS which errors "null vector", workPoint.2POINTS succeeds (midpoint of same point = that point).

---

## 07 — CENTER

Script: `scripts/07-center.mjs` — ✅ maxLevel=31 with sketch circle.

Note: `sketch.circle` param is `centerPos` not `center`.

---

## 08 — errors + names + built-ins

Script: `scripts/08-errors.mjs` — all descriptive errors.

- No id: "\"id\" must be provided to create CC_WorkPoint"
- Invalid type: lists all 8 valid values
- No refs: "\"references\" must be provided"
- Expression position: fails (same as other work geometry)
- Duplicates: allowed, getWorkGeometry returns first
- **No built-in work points** — `getWorkGeometry` found `Origin` (ID 22) which is a work CSys, not a work point. No dedicated built-in work points exist.

---

## 09 — INNERCIRCLE

Script: `scripts/09-innercircle.mjs` — ✅ maxLevel=31 with 3 sketch lines forming a triangle. Computes the incircle center.
