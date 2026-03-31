# Changes — curve.line

## New file: `references/curve/line.md`

```diff
+# curve.line
+
+Creates one or more lines in a shape container.
+
+## Prerequisites
+- A shape (`curve.shape`) inside an entity injection (`part.entityInjection`)
+
+## Key Parameters
+- `id` (required) — shape ID. Must be a shape ID, not part or EI.
+- `startPos` (required) — `[x, y, z]` start point. Exactly 3 elements required.
+- `endPos` (required) — `[x, y, z]` end point. Exactly 3 elements required.
+
+## Batch Creation
+- Pass array of objects for multiple lines in one call
+- Can mix different shape IDs in the same batch
+- Errors are per-item — valid lines still created even if one fails
+
+## Gotchas
+- Degenerate lines (start==end) → ERROR
+- Points must be exactly [x, y, z] — no 2D shorthand
+- No individual line IDs — lines share geometry in the shape
+- 3D lines and all coordinate ranges work
+
+## Common Errors
+- 1001: wrong ID type (must be shape)
+- 1004: missing required parameter
+- 1006: invalid/non-existent ID
+- 0: degenerate line or bad point format
```
