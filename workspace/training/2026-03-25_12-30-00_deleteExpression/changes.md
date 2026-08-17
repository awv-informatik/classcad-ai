# Changes — part.deleteExpression training

## New file: `references/part/deleteExpression.md`

Key findings documented:

- `toDelete` takes an array of **strings** (names), not objects
- Same silent no-op trap as updateExpression when using wrong form (direct `name` param)
- **Batch is ATOMIC** — one bad name rolls back all deletions
- **Formula inlining on delete** — derived expressions survive by replacing the deleted reference with its literal value (e.g., `"base * 2"` → `"10 * 2"`)
- **Feature survival** — deleting an expression used by `@expr.NAME` does NOT destroy the feature; value is baked in
- Duplicate names in toDelete are silently ignored (no error)
- Delete order is independent for cross-referenced expressions
- Array param form does NOT work (same as updateExpression)
- Return value is numeric 1/0, not boolean
