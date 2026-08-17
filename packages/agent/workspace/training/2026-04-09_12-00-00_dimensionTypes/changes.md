# Changes — Dimension Types Training

## File: `references/sketch/dimension.md`

```diff
-| `DIAMETER` | 1 | circle, arc | Diameter |
-| `ANGLE` | 2 | lines | Angle between two lines |
-| `ANGLEOX` | 1 | line | Angle of line relative to X axis |
+| `DIAMETER` | 1 | circle, arc | Diameter (2 × radius) |
+| `ANGLE` | 2 (non-parallel lines) | lines | Angle between two lines |
+| `ANGLEOX` | 1 (non-horizontal line) | line | Angle of line relative to X axis |

-**Critical rule for HORIZONTAL_DISTANCE/VERTICAL_DISTANCE with 2 geomIds:** Both must be points. Passing 2 lines fails with "both must be points."
+**Critical rule for HORIZONTAL_DISTANCE/VERTICAL_DISTANCE with 2 geomIds:** Both must be points. Passing 2 lines or line+point fails with "both must be points."

+### Type-Specific Details (NEW SECTION)
+**OFFSET** — measures distance along/between geometry. Works with perpendicular lines.
+**HORIZONTAL_DISTANCE** — always measures X-axis projection. Vertical line = valid dim measuring 0.
+**VERTICAL_DISTANCE** — always measures Y-axis projection. Horizontal line = valid dim measuring 0.
+**RADIUS vs DIAMETER** — different structure classes; value = radius vs 2×radius.
+**ANGLE** — requires 2 different non-parallel lines. dimPos selects sector 0-3. reflex must be boolean.
+**ANGLEOX** — measures from X-axis CCW. Line direction matters. 0° is degenerate (division by zero).

+## Structure Tree (EXPANDED)
+- Linear dims: orientationType mapping (0=VD, 1=HD, 2=OFFSET), angle, paramName semantics
+- RADIUS: CC_RadialFeatureDimension, value/radius reflect geometry not constraint
+- DIAMETER: CC_DiameterFeatureDimension (separate class from RADIUS)
+- ANGLE/ANGLEOX: CC_AngularFeatureDimension, sector, ccw, cornerPt, paramName differences
+- Added note: no API to read back numeric constraint value

+## Common Errors (3 NEW)
+| "Division by zero!" | ANGLEOX on horizontal line | Avoid; use ANGLE instead |
+| NullMem error | ANGLE between parallel lines | Lines must be non-parallel |
+| "parameter reflex has wrong type" | reflex: 'TRUE' (string) | Use boolean true/false |
```
