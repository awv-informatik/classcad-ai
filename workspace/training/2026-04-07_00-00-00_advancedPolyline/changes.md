# Changes

## New file: `references/curve/advancedPolyline.md`

```diff
+# curve.advancedPolyline
+
+Creates a polyline using the PLD (PointLineDefinition) system — a powerful way to define 2D profiles with absolute/relative coordinates, angle+length segments, radius fillets, and chamfers.
+
+## Prerequisites
+- A part, entity injection, and shape container
+
+## Key Parameters
+- `id` — shape ID
+- `pld` — Array of PointLineDefinitions. Min 2 entries. First must be absolute (xa, ya).
+- `close` — connects last point to first
+
+## PLD Entry Modes
+- Absolute (xa/ya), Relative (xr/yr), Mixed, Angle+Length (l/a, l/ar), Movement+Angle combos
+
+## Vertex Modifiers
+- `r` — radius fillet (tangent arc)
+- `c` — chamfer (cut corner)
+
+## Gotchas (key findings from training)
+- First PLD must be absolute
+- Minimum 2 PLDs (1 point crashes, empty is silent no-op)
+- r: 0 crashes (ComputeFillet array index error)
+- r: negative creates outward-bulging arc (undocumented)
+- c: 0 is a no-op
+- c: negative is silently accepted (avoid)
+- Oversized r/c gives clear error
+- r + c on same point gives clear error
+- r on first point works when closed
+
+## Common Errors table, Working Example, Usage Hints, Related APIs
```
