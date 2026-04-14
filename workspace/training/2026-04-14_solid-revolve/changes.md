# Changes: solid.revolve training

## New file: `references/solid/revolve.md`

```diff
+# solid.revolve
+
+Creates a solid by revolving a closed 2D profile around an axis defined by a point and direction vector.
+
+## Key findings documented:
+- Profile-axis relationship: offset → ring/torus, touching → disc, crossing → solid disc
+- Angle behavior: 0 is silent degenerate, negative works (reverse), >2PI caps at 360°
+- angle=0 silently accepted — always validate non-zero
+- curve.circle uses `centerPos` not `center` (common mistake)
+- curve.circle returns VOID, not an ID — pass shape ID to curves
+- No updateRevolve exists — delete and recreate
+- Open profiles fail with "Brep after revolve operation not manifold"
+- Direction does not need to be normalized
+- originPos can be any point, not just world origin
+- Common errors table: wrong ID type, open profile, NULLID
+- Working examples: rectangle profile, circle profile, partial revolve with transforms
```
