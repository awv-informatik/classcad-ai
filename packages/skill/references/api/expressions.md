# Expressions

> Source: [buerligons.io/docs/Expressions](https://buerligons.io/docs/Expressions)

## Mathematical Expressions

Beyond simple values, expressions support full mathematical formulas. For example, to make a box whose height is always **twice its width**:

- `width` = a simple changeable value
- `height` = `width * 2` (a mathematical expression referencing another expression by name)

### Mathematical Functions and Constants

Below is the full list of mathematical functions and constants available in expression input fields:

| Function                   | Description                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `abs(value)`               | Returns the value without sign.                                                                                               |
| `sign(value)`              | Returns the sign of the value (`+1` or `-1`). `0` returns `0`.                                                                |
| `max(value1, ..., valueN)` | Returns the biggest value of the arguments.                                                                                   |
| `min(value1, ..., valueN)` | Returns the smallest value of the arguments.                                                                                  |
| `a_r(value)`               | Converts an angle from degrees to radians.                                                                                    |
| `r_a(value)`               | Converts an angle from radians to degrees.                                                                                    |
| `sin(value)`               | Returns the sine of value (in radians).                                                                                       |
| `sinh(value)`              | Returns the hyperbolic sine of value (in radians).                                                                            |
| `asin(value)`              | Returns the arcsine of value (in radians).                                                                                    |
| `cos(value)`               | Returns the cosine of value (in radians).                                                                                     |
| `cosh(value)`              | Returns the hyperbolic cosine of value (in radians).                                                                          |
| `acos(value)`              | Returns the arccosine of value (in radians).                                                                                  |
| `tan(value)`               | Returns the tangent of value (in radians).                                                                                    |
| `tanh(value)`              | Returns the hyperbolic tangent of value (in radians).                                                                         |
| `atan(value)`              | Returns the arctangent of value (in radians). The two-argument form `atan(value, divisor)` returns values in the range of PI. |
| `exp(value)`               | Returns e raised to the power of value.                                                                                       |
| `ln(value)`                | Returns the natural logarithm of value.                                                                                       |
| `log(value)`               | Returns the logarithm of value.                                                                                               |
| `sqrt(value)`              | Returns the square root of value.                                                                                             |
| `pow(value, exponent)`     | Returns value raised to the exponent power.                                                                                   |
| `fmod(value1, value2)`     | Returns `value1` modulo `value2` (remainder of `value1 / value2`).                                                            |
| `div(value1, value2)`      | Returns the integer division `(int)(value1 / value2)`.                                                                        |

| Constant | Description                                   |
| -------- | --------------------------------------------- |
| `'C:PI'` | Definition for PI (`3.14159265358979323846`). |

## Referencing Named Expressions in Feature Parameters

Named expressions created with `part.expression` can be referenced in feature parameters (such as `box`, `cylinder`, `revolve`, `workCSys`, etc.) using the **`@expr.NAME`** prefix syntax.

### Syntax

Use `@expr.` followed by the expression name as a string value:

```js
// Create named expressions
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'length', value: 41 },
    { name: 'height', value: '0.65*length' },
    { name: 'thickness', value: '0.2*length' },
  ],
})

// Reference them in feature parameters with @expr. prefix
await api.v1.part.box({
  id: partId,
  length: '@expr.length',
  height: '@expr.height',
  width: '@expr.thickness',
})
```

### Formulas with Expression References

You can combine `@expr.NAME` references with arithmetic and math functions within the same string:

```js
await api.v1.part.cylinder({
  id: partId,
  diameter: '@expr.baseCylDiam',             // simple reference
  height: '@expr.flangeHeight + 10',         // arithmetic
})

await api.v1.part.circularPattern({
  id: partId,
  angle: '@expr.holeAngle',
  count: '@expr.holeCount',
})
```

### String-Encoded Arrays (Offsets, Positions)

The `@expr.NAME` syntax also works inside string-encoded point arrays used for offsets and positions:

```js
await api.v1.part.workCSys({
  id: partId,
  offset: '[@expr.thickness, 0, @expr.thickness]',
})

await api.v1.part.workAxis({
  id: partId,
  position: '[0, @expr.upperCylDiam / 2 + @expr.thickness, 0]',
})

await api.v1.part.translation({
  id: partId,
  distance: '-2*@expr.thickness',
})
```

### Common Mistake

**Bare expression names do NOT work** in feature parameters. The `@expr.` prefix is required:

```js
// ❌ FAILS — "Could not convert api params."
await api.v1.part.box({ id: partId, length: 'L' })
await api.v1.part.box({ id: partId, length: 'L + 0' })

// ✅ WORKS
await api.v1.part.box({ id: partId, length: '@expr.L' })
await api.v1.part.box({ id: partId, length: '@expr.L + 0' })
```

> **Note:** Inline formulas that do NOT reference named expressions work without the prefix (e.g., `length: '3*40'`). The `@expr.` prefix is only needed when referencing expressions created with `part.expression`.

## Linking and Unlinking Expressions (Post-Hoc Binding)

There are **two ways** to connect a named expression to a feature parameter:

1. **At creation time** — pass `@expr.NAME` as the parameter value (see above).
2. **After creation** — use `part.linkWithExpression` to bind an expression to an existing feature parameter that was originally set with a plain value.

`part.unlinkExpression` disconnects an expression from a feature parameter.

### linkWithExpression

Connects a named expression to a feature parameter or sketch dimension **after** the feature was already created with a plain value.

```js
// Box created with plain height=40
const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

// Later, bind 'height' param to expression 'H' (which has value 120)
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
await api.v1.common.recalc()
// Box height is now 120, driven by expression H
```

**Parameters:**

- `id` — feature or sketch dimension ID (NOT the part ID)
- `exprName` — name of the expression to link (must exist in the part's expression set)
- `name` — feature parameter name to bind (e.g., `'height'`, `'length'`, `'diameter'`, `'limit2'`)

Can also re-link a param that is already expression-driven (via `@expr.` at creation) to a different expression.

### unlinkExpression

Disconnects an expression from a feature parameter. The parameter **freezes at the expression's current value** — it does NOT revert to the original hard-coded value.

```js
// Box height is linked to expression H=120
await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
await api.v1.common.recalc()
// Box height is now a plain value of 120 (frozen). Changing H has no effect.
```

**Parameters:**

- `id` — feature or sketch dimension ID
- `name` — parameter name to disconnect

### Key behavior

- Both return `result: VOID` (null), maxLevel=31 on success
- Both require `common.recalc()` afterward for geometry to update
- **Unlink freezes the current expression value** — the param becomes a plain value equal to whatever the expression evaluated to at the moment of unlinking. The original hard-coded value (from feature creation) is NOT restored.
