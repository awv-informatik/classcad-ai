# Changes — solid.fillet training

## New file: `references/solid/fillet.md`

```diff
+# solid.fillet
+
+Creates a fillet (rounded edge) on one or more brep edges within an entity injection feature. Modifies the solid(s) in-place — no new entity is created.
+
+## Prerequisites
+
+- A part (`part.create`)
+- An entity injection feature (`part.entityInjection`)
+- A solid with edges to fillet (e.g., `solid.box`, `solid.extrusion`, etc.)
+- Brep edge IDs obtained via `part.getGeometryIds` or `part.getBrepGeometryByIndex`
+
+## Key Parameters
+
+- `id` — entity injection feature ID (not the solid ID, not the part ID)
+- `radius` — fillet radius. Must be positive. Zero is accepted but is a no-op. Negative → error.
+- `geomIds` — array of brep edge IDs. These are negative numbers (brep sub-element convention). Can include edges from different solids in the same EIF.
+
+## Return Value
+
+`id[]` — array of solid IDs that were modified. Returns `null` with `maxLevel: 51` on failure.
+
+## Getting Edge IDs
+
+1. `part.getGeometryIds` (position-based — preferred)
+2. `part.getBrepGeometryByIndex` (index-based — works for primitives)
+
+## Key Gotchas
+
+- Edge IDs invalidate after each fillet call — always re-query
+- Radius limit is geometry-dependent — no simple rule
+- Negative radius → error; zero radius → silent no-op
+- `getBrepGeometryByIndex` lineIndex may return 0 for extrusions — use getGeometryIds
+- Fillet is irreversible in entity injection context
```
