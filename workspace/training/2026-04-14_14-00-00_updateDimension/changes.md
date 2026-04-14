# Skill Changes — sketch.updateDimension

## New file: `references/sketch/updateDimension.md`

Full LLM doc for `sketch.updateDimension` covering:
- Numeric and formula string values (works)
- Expression binding (does NOT work — @expr.NAME, linkWithExpression all fail)
- Return value semantics: 0=unsolved, 1=under-constrained, 2=well-constrained (NOT boolean)
- All 7 dimension types tested
- Edge cases (zero, negative, large, sequential, over-constrained)
- Error cases with codes
- Working example

## Updated: `references/sketch/dimension.md`

Corrected 3 references that incorrectly claimed `@expr.NAME` works via `updateDimension`:

```diff
-- **`@expr.NAME` does NOT work** in this param — use `updateDimension` to link after creation
+- **`@expr.NAME` does NOT work** in this param. It also does NOT work in `updateDimension`. Expression binding is not supported for dimensions — use `updateDimension` with computed numeric values instead.

-- **`@expr.NAME` does NOT work** in the `value` parameter. ... Use `updateDimension` to link a dimension to an expression after creation.
+- **`@expr.NAME` does NOT work** in the `value` parameter. ... Expression binding is not supported for dimensions at all — neither at creation nor via `updateDimension`. Use `updateDimension` with computed numeric values instead.

-- `sketch.updateDimension` — change dimension value after creation (also supports `@expr.NAME`)
+- `sketch.updateDimension` — change dimension value after creation (numeric values and formula strings only — NOT `@expr.NAME`)
```
