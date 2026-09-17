# Feature Primitives vs Direct Solids

Two paradigms for 3D geometry: visually identical results, different capabilities, API surface, and ID types. Both can coexist in one part.

| | Feature primitives (`part.box/cylinder/cone/sphere`) | Direct solids (`solid.box/cylinder/cone/sphere`) |
|---|---|---|
| Created in | part (`id` = part ID) | entity injection feature (`id` = EIF ID) |
| Returns | **feature ID** (type "feature") | **solid ID** (type "solid") |
| History | Feature tree — parametric history, design intent | Flat geometry in the EIF — no history |
| Modification | `update*` via open/close | No update API — `solid.translation` / `rotation` / `scale` |
| Dimensions | Expressions (`@expr.NAME`, inline math) | Strictly `real` — any string rejected (code 1001: "wrong type! It should be of type (real)") |
| Positioning | `references: [wcsId]` (workCSys only) | `translation`, `rotation`, `rotateFirst` |

## Booleans Across Paradigms

- `part.boolean` takes only type "feature" ids (target and tools). A solid ID as tool → code 1001: "wrong id type! Provide only following id types: ['feature']". An EIF is a feature, so pass the **EIF id**: `part.boolean({ type: 'SUBTRACTION', target: boxFeature, tools: [eifId] })` subtracts all solids in the EIF (volume exact). An EIF can also be the target.
- `solid.subtraction`/`union`/`intersection` take only type "solid" ids — a feature ID errors.

## ID Type Implications

| API | Feature ID | Solid ID | Part ID |
|---|---|---|---|
| `calculateMassProperties` | ❌ | ✅ | ✅ (all bodies combined — use this for feature boxes) |
| `setObjectName` | ✅ | ✅ | ✅ |
| `updateBox` | ✅ (via open/close) | ❌ | ❌ |
| `part.boolean` target/tools | ✅ | ❌ | ❌ |
| `solid.subtraction` target/tools | ❌ | ✅ | ❌ |
| `deleteFeature` | ✅ (in `ids`) | ❌ | ❌ |
| `deleteSolid` | ❌ | ✅ (in `ids`) | ❌ |

## Alignment Conventions Differ

Measured (old docs had this wrong):

| Primitive | `solid.*` (direct) | `part.*` (feature) |
|---|---|---|
| `box` | **fully centered** — corners `(±L/2, ±W/2, ±H/2)` | **corner-aligned** — `(0,0,0)` to `(+L, +W, +H)` |
| `cylinder` | **fully centered** — z=`-H/2..+H/2` | **base at origin** — z=`0..H` |
| `cone` | **fully centered** — z=`-H/2..+H/2` | **base at origin** — z=`0..H` |
| `sphere` | centered at origin | centered at origin |

Measured with boxes `length=100, width=80, height=60`, cylinders `diameter=30, height=100`, cones `bDiameter=tDiameter=40, height=80`, spheres `radius=25`; vertex 0 and COG via `getBrepGeometryByIndex` + `getGeometryPositions` and `calculateMassProperties`.

- `part.box(100,80,60)` sits in the +X+Y+Z octant, `solid.box(100,80,60)` is centered — to overlay, translate one by `(L/2, W/2, H/2)`.
- Through-cut of a plate at z=`-t/2..+t/2`: `solid.cylinder(D, H)` needs no z-translation, just `height > t`; `part.cylinder(D, H)` needs a workCSys at z=`-H/2` (or equivalent offset).

## Silent Param Ignoring

Unknown params are silently discarded (maxLevel 31, no warning) in both paradigms:
- `part.box` with `translation: [100, 0, 0]` → box at origin
- `solid.box` with `references: [wcsId]` → box at origin

## Modification After Creation

| | Feature | Direct Solid |
|---|---|---|
| **Change dimensions** | `openFeature` → `updateBox` → `closeFeature` | Not possible — delete and recreate |
| **Move** | `updateBox({ references: [newWcsId] })` | `solid.translation({ target, translation })` |
| **Rotate** | Create via rotated WCS | `solid.rotation({ target, rotation })` |
| **Scale** | Update dims with multiplied values | `solid.scale({ target, factor })` |
| **Expression-driven** | ✅ `@expr.NAME` in any dim param | ❌ |

## When to Use Which

- **Feature primitives** — parametric modeling, expression-driven geometry, design intent that may change; needed for `updateBox`, expression linkage, feature tree operations like `part.boolean`.
- **Direct solids** — procedural/one-off geometry, imported geometry manipulation; post-creation transforms, `solid.*` booleans, per-solid mass measurement.

## Deletion

- Feature: `part.deleteFeature({ ids: [featId] })`
- Solid: `solid.deleteSolid({ id: eifId, ids: [solidId] })` — removes one solid from the EIF
- EIF container: `part.deleteFeature({ ids: [eifId] })` — removes EIF + all solids inside
