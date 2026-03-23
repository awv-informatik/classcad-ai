# Expressions

> Source: [buerligons.io/docs/Expressions](https://buerligons.io/docs/Expressions)

## Mathematical Expressions

Beyond simple values, expressions support full mathematical formulas. For example, to make a box whose height is always **twice its width**:

- `width` = a simple changeable value
- `height` = `width * 2` (a mathematical expression referencing another expression by name)

![Mathematical Expression Example](https://buerligons.io/doc/assets/expressions/BoxWithExpression.png)

In the input field of the expressions, you can access other expressions **by their name**. The gray/disabled field next to the expression always shows the **solved value**.

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
