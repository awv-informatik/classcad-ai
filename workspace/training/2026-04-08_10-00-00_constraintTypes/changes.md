# Changes — Constraint Types Deep Study

## File modified: `references/sketch/constraint.md`

Major update based on testing every constraint type individually.

### Key additions:

**New "Critical: Constraints Are Declarative Only" section** — the single most important finding:
```diff
+## Critical: Constraints Are Declarative Only
+
+**Constraints NEVER reposition geometry.** Adding a constraint stores a rule and returns an ID (maxLevel=31 = success), but the solver does not run.
+
+**No operation triggers the solver either:**
+- `moveGeometry` — raw translation of specified geometry only. Ignores all constraints.
+- `updateGeometry` — raw position setter. Does not enforce constraints.
+- `dimension` / `updateDimension` — stores dimensional constraints but does not reposition.
```

**Expanded constraint type table** — each type now has verified geomIds variants:
```diff
-| `COINCIDENT` | `[pt1, pt2]` or `[pt, curve]` | Point-point coincidence, or point-on-curve |
+| `COINCIDENT` | `[pt1, pt2]` or `[pt, curve]` | Point-point coincidence, or point-on-curve. Works with lines, circles, arcs. **Order-independent** |
-| `CONCENTRIC` | `[circle1, circle2]` | Two circles/arcs share center |
+| `CONCENTRIC` | `[circle1, circle2]` or `[arc1, arc2]` | Two circles or arcs share center. Works for circle-circle, arc-arc, and circle-arc. |
-| `FIXATION` | `[geomId]` | Pins a point or curve in place (1 geomId) |
+| `FIXATION` | `[geomId]` | Pins geometry in place. Works on **all geometry types**: points, lines, arcs, circles. |
+| `TANGENT` | `[curve1, curve2]` | Tangency between arc-line, circle-line, or arc-arc. |
```

**New "Point IDs for Constraints" section** with getPoints/getPositions behavior table:
```diff
+| Line | `{ startId, endId }` |
+| Arc | `{ startId, endId, centerId }` |
+| Circle | `{ centerId }` |
+| Standalone point (`sketch.point`) | `null` — use the point ID directly |
```

**Updated Gotchas** — added conflict detection finding, moveGeometry warning, error 1001 documentation.

**Corrected prior claim**: Changed "Constraints don't necessarily move geometry" to the stronger, verified: "Constraints NEVER reposition geometry."
