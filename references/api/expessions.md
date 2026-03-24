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
