# Changes — part.renameExpression training

## New file: `references/part/renameExpression.md`

Key findings documented:

- `toRename` takes `{ name, newName }` objects
- **Formula propagation** — renaming auto-updates all formulas referencing the old name
- Same silent no-op trap with wrong form (direct name/newName params)
- **Batch is ATOMIC with pre-batch validation** — renames don't see each other's effects
- **No swaps or chains** — `a→b, b→a` fails because `b` already exists at validation time
- Cannot rename to an existing name or to the same name (both are errors)
- Same name validation rules as `expression()` creation
- Array param form does NOT work
- Return value is numeric 1/0
