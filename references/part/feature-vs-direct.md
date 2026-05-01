# Feature Primitives vs Direct Solids

ClassCAD offers two paradigms for creating 3D geometry. They produce identical visual results but differ in capabilities, API surface, and ID types. **The two paradigms are strictly isolated for boolean operations — you cannot mix them.**

## The Two Paradigms

**Feature primitives** (`part.box`, `part.cylinder`, `part.cone`, `part.sphere`):
- Created inside a part (`id` = part ID)
- Return a **feature ID** (type "feature")
- Live in the feature tree — parametric history, design intent
- Support `update*` APIs via open/close pattern
- Accept expression-driven dimensions (`@expr.NAME`, inline math)
- Positioned via `references: [wcsId]` (workCSys only)

**Direct solids** (`solid.box`, `solid.cylinder`, `solid.cone`, `solid.sphere`):
- Created inside an entity injection feature (`id` = EIF ID)
- Return a **solid ID** (type "solid")
- Flat geometry inside the EIF container — no parametric history
- No update API — use post-creation transforms (`solid.translation`, `solid.rotation`, `solid.scale`)
- Dimensions are strictly `real` — strings of any kind are rejected (code 1001: "wrong type! It should be of type (real)")
- Positioned via `translation`, `rotation`, `rotateFirst` params

## Critical: Paradigms Don't Mix for Booleans

`part.boolean` requires all IDs (target and tools) to be type "feature". Passing a solid ID as a tool → error code 1001: "wrong id type! Provide only following id types: ['feature']".

`solid.subtraction`/`union`/`intersection` require all IDs to be type "solid". Passing a feature ID → error.

**Both paradigms can coexist in the same part** — a part can contain feature boxes AND entity injection features simultaneously. They just can't interact via boolean operations.

## ID Type Implications

Different APIs accept different ID types. Common mistakes:

| API | Feature ID | Solid ID | Part ID |
|---|---|---|---|
| `calculateMassProperties` | ❌ | ✅ | ✅ (all bodies combined) |
| `setObjectName` | ✅ | ✅ | ✅ |
| `updateBox` | ✅ (via open/close) | ❌ | ❌ |
| `part.boolean` target/tools | ✅ | ❌ | ❌ |
| `solid.subtraction` target/tools | ❌ | ✅ | ❌ |
| `deleteFeature` | ✅ (in `ids` array) | ❌ | ❌ |
| `deleteSolid` | ❌ | ✅ (in `ids` array) | ❌ |

To get mass properties for a feature-based box, use the **part ID** (which includes all bodies), not the feature ID.

## Alignment Conventions Differ

The two families use **different default placements** at the origin. This is empirically verified — old docs got it wrong because the question was never measured.

| Primitive | `solid.*` (direct) | `part.*` (feature) |
|---|---|---|
| `box` | **fully centered** — corners at `(±L/2, ±W/2, ±H/2)` | **corner-aligned** — extends from `(0,0,0)` to `(+L, +W, +H)` |
| `cylinder` | **fully centered** — z=`-H/2..+H/2` | **base at origin** — z=`0..H` (extends in +Z) |
| `cone` | **fully centered** — z=`-H/2..+H/2` | **base at origin** — z=`0..H` (extends in +Z) |
| `sphere` | **centered at origin** | **centered at origin** |

Verified empirically (`scripts/verify-primitive-alignment.mjs`) with `length=100, width=80, height=60` for boxes, `diameter=30, height=100` for cylinders, `bDiameter=tDiameter=40, height=80` for cones, `radius=25` for spheres. Vertex 0 and COG read via `getBrepGeometryByIndex` + `getGeometryPositions` and `calculateMassProperties`.

**Practical implication:** mixing primitives across families requires accounting for this offset. A `part.box(100,80,60)` and a `solid.box(100,80,60)` in the same part are not in the same place — the part-feature box sits in the +X+Y+Z octant while the direct solid is centered on the origin. To overlay them, translate one by `(L/2, W/2, H/2)`.

For through-cuts: a `solid.cylinder(D, H)` already extends z=`-H/2..+H/2` — to drill a plate that sits at z=`-t/2..+t/2`, no z-translation is needed; just `height > t`. A `part.cylinder(D, H)` extends z=`0..H` — to drill the same plate, you need a workCSys placed at z=`-H/2` (or some equivalent vertical offset).

## Silent Param Ignoring

Unknown params are silently accepted and ignored by both paradigms:
- `part.box` with `translation: [100, 0, 0]` → succeeds, box at origin (translation ignored)
- `solid.box` with `references: [wcsId]` → succeeds, box at origin (references ignored)

No error, no warning. The API returns success (maxLevel 31) with the param silently discarded.

## Modification After Creation

| | Feature | Direct Solid |
|---|---|---|
| **Change dimensions** | `openFeature` → `updateBox` → `closeFeature` | Not possible — must delete and recreate |
| **Move** | `updateBox({ references: [newWcsId] })` | `solid.translation({ target, translation })` |
| **Rotate** | Create via rotated WCS | `solid.rotation({ target, rotation })` |
| **Scale** | Update dims with multiplied values | `solid.scale({ target, factor })` |
| **Expression-driven** | ✅ `@expr.NAME` in any dim param | ❌ |

## When to Use Which

**Feature primitives** — parametric modeling, expression-driven geometry, design intent that may change. Choose this when you need `updateBox`, expression linkage, or feature tree operations like `part.boolean`.

**Direct solids** — procedural/programmatic geometry, one-off constructions, imported geometry manipulation. Choose this when you need post-creation transforms, direct boolean operations via `solid.*`, or individual solid mass measurement.

## Deletion

- Feature: `part.deleteFeature({ ids: [featId] })` — removes from feature tree
- Solid: `solid.deleteSolid({ id: eifId, ids: [solidId] })` — removes individual solid from EIF
- EIF container: `part.deleteFeature({ ids: [eifId] })` — removes EIF + all solids inside
