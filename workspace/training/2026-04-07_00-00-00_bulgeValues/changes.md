# Changes: Bulge Values Study

## File: `references/curve/polyline2d.md`

### Summary
Extended the Bulge Values section with comprehensive reference table, inverse formula, direction rules, geometry relationships, extreme value behavior, and a rounded rectangle pattern.

### Diff

```diff
-The bulge is `tan(a/4)` where `a` is the included arc angle between two consecutive points.
+The bulge is `tan(a/4)` where `a` is the included arc angle between two consecutive points. The inverse formula: `angle = 4 * atan(bulge)`.

-| Bulge value | Meaning |
-|---|---|
-| `0` | Straight line segment |
-| `0.41421` (`tan(π/8)`) | 90° arc |
-| `1` | 180° semicircle |
-| `> 1` (e.g. `2`) | Arc > 180° (major arc) |
-| negative | Clockwise arc (same magnitude = same angle, opposite direction) |
+### Quick Reference Table
+| Angle | Bulge value | Notes |
+|-------|-------------|-------|
+| 0° | `0` | Straight line segment |
+| 10° | `0.04366` | Barely curved |
+| 30° | `0.13165` | Gentle arc |
+| 45° | `0.19891` | |
+| 60° | `0.26795` | |
+| **90°** | **`0.41421`** | Most common — corner fillets, rounded rects |
+| 120° | `0.57735` | |
+| **180°** | **`1.0`** | Semicircle — sagitta equals half the chord |
+| 270° | `2.41421` | Major arc (> half circle) |
+| 360° | `∞` | Cannot represent a full circle — use curve.circle |

+### Direction
+- Positive bulge → counterclockwise
+- Negative bulge → clockwise (same magnitude = same angle, mirrored)
+- Each segment's bulge is independent

+### Geometry relationship
+- Bulge is a pure angle parameter — independent of segment length
+- Sagitta = bulge * chord_length / 2
+- For 180° semicircle: sagitta = chord/2

+### Extreme values
+- Very small/large bulges accepted without error or clamping
+- Bulge on zero-length segment silently accepted

+## Common Pattern: Rounded Rectangle
+Added practical rounded rectangle pattern using 90° bulge at offset corners.
```
