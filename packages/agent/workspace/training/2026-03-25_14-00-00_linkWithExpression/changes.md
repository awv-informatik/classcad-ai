# Changes — part.linkWithExpression training

## New file: `references/part/linkWithExpression.md`

- Post-hoc binding of expressions to feature params
- Takes feature/dimension ID (NOT part ID)
- No validation on param name (silent success for bad names)
- Can re-link without unlinking first
- Same expression can drive multiple params

## Modified: `references/api/expessions.md`

- Added "Linking and Unlinking Expressions" section documenting both linkWithExpression and unlinkExpression
- Documented the freeze-on-unlink behavior
