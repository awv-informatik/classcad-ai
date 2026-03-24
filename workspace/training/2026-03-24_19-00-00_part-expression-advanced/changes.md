# Changes — part.expression advanced training

## Updated file: `references/part/expression.md`

Major additions from real-world usage testing:

### New sections added:
- **Using Expressions in Feature Parameters** — `@expr.NAME` syntax, inline formulas, mixing with arithmetic/functions, string-encoded point arrays
- **Updating Expressions & Recalculation** — `updateExpression` correct syntax (`toUpdate` array!), `common.recalc()` requirement, cascade behavior

### Key findings documented:
- Inline formulas (`'3 * 40'`, `'sqrt(2500)'`) work in feature params without @expr prefix
- `@expr.` mixes freely with arithmetic, functions, and constants
- `@expr.` works inside string-encoded arrays (`'[@expr.x, 0, @expr.z]'`)
- `updateExpression` uses `toUpdate` array — direct name/value params are **silently ignored**
- Feature geometry requires `common.recalc()` after expression updates
- Full cascade chain works: base expr → derived expr → feature param → geometry
- `updateExpression` can change formulas, not just numeric values

### Updated:
- Working example replaced with realistic parametric model (flanged block with cascading dimensions)
- Related section expanded with `common.recalc` and `linkWithExpression` param hints
