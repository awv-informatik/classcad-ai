# Skill Changes — Feature vs Direct Comparison

## New file: `references/part/feature-vs-direct.md`

Comprehensive comparison of feature primitives (`part.box`, etc.) vs direct solids (`solid.box`, etc.).

```diff
+# Feature Primitives vs Direct Solids
+
+ClassCAD offers two paradigms for creating 3D geometry. They produce identical visual results but differ in capabilities, API surface, and ID types. **The two paradigms are strictly isolated for boolean operations — you cannot mix them.**
+
+## The Two Paradigms
+
+**Feature primitives** (`part.box`, `part.cylinder`, `part.cone`, `part.sphere`):
+- Created inside a part (`id` = part ID)
+- Return a **feature ID** (type "feature")
+- Live in the feature tree — parametric history, design intent
+- Support `update*` APIs via open/close pattern
+- Accept expression-driven dimensions (`@expr.NAME`, inline math)
+- Positioned via `references: [wcsId]` (workCSys only)
+
+**Direct solids** (`solid.box`, `solid.cylinder`, `solid.cone`, `solid.sphere`):
+- Created inside an entity injection feature (`id` = EIF ID)
+- Return a **solid ID** (type "solid")
+- Flat geometry inside the EIF container — no parametric history
+- No update API — use post-creation transforms (`solid.translation`, `solid.rotation`, `solid.scale`)
+- Dimensions are strictly `real` — strings of any kind are rejected (code 1001: "wrong type! It should be of type (real)")
+- Positioned via `translation`, `rotation`, `rotateFirst` params
+
+## Critical: Paradigms Don't Mix for Booleans
+...
+## ID Type Implications
+...
+## Silent Param Ignoring
+...
+## Modification After Creation
+...
+## When to Use Which
+...
+## Deletion
+...
```

## Updated: `references/part/box.md`

Expanded the comparison table with boolean system, mass properties, ID types, and cross-paradigm note.

```diff
 | | `part.box` | `solid.box` |
 |---|---|---|
 | Container | Part (feature tree) | Entity injection |
 | `id` param | Part ID | Entity injection ID |
-| Update API | `updateBox` (via open/close) | None |
-| Positioning | `references` (workCSys) | `translation`, `rotation` |
-| Expressions | `@expr.` syntax in dims | Not supported |
-| Feature tree | Yes — full parametric history | No — direct geometry |
-| Use when | Parametric modeling, design intent | Direct geometry manipulation |
+| ID type returned | feature | solid |
+| Update API | `updateBox` (via open/close) | None (use `solid.translation`/`rotation`/`scale`) |
+| Positioning | `references` (workCSys) | `translation`, `rotation`, `rotateFirst` |
+| Expressions | `@expr.` syntax in dims | ❌ strictly `real` only |
+| Boolean system | `part.boolean` (feature IDs only) | `solid.*` booleans (solid IDs only) |
+| Mass properties | Via part ID (feature ID rejected) | Via solid ID or part ID |
+| Feature tree | Yes — full parametric history | No — flat inside EIF |
+| Cross-paradigm | Cannot mix in booleans | Cannot mix in booleans |
+
+See `references/part/feature-vs-direct.md` for a comprehensive comparison.
```
