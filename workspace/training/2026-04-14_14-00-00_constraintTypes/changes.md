# Skill Changes — Constraint Types Study

## File: `references/sketch/constraint.md`

### TANGENT type — expanded geomIds to include circle-circle
```diff
-| `TANGENT` | `[arc/circle, line]` | Moves unconstrained arc/circle so its edge touches the line (distance from center to line = radius). |
+| `TANGENT` | `[arc/circle, line]` or `[circle1, circle2]` | Arc/circle + line: moves so edge touches line (center-to-line distance = radius). Circle + circle: moves to external tangency (center distance = r1 + r2). |
```

### SYMMETRY type — clarified line vs point behavior
```diff
-| `SYMMETRY` | `[axis, elem1, elem2]` | Mirrors the unconstrained element about the axis line. **Axis must be first in geomIds.** Works with points and lines. |
+| `SYMMETRY` | `[axis, elem1, elem2]` | Mirrors the unconstrained element about the axis line. **Axis must be first in geomIds.** Works with points (exact) and lines (approximate if different lengths — solver mirrors orientation but preserves individual line lengths). |
```

### Solver Behavior — added chaining, deletion, and recommended order
```diff
+- **Constraint chaining propagates.** If PARALLEL(A,B) and PARALLEL(B,C), then C becomes parallel to A. The solver resolves transitive relationships automatically.
+- **Deleting a constraint does NOT revert geometry.** Geometry stays where the solver placed it. Only the constraint relationship is removed.
+- **Recommended application order:** FIXATION (anchor) → COINCIDENT (connect) → directional (H/V/PARALLEL/PERP) → equality/dimensional (EQUAL_LENGTH, dimensions).
```

### Gotchas — added SYMMETRY lines, getPositions on circles, constraint deletion
```diff
+- **SYMMETRY on lines with different lengths is approximate.** The solver mirrors orientation but preserves each line's original length. For exact mirroring, ensure lines have equal length (add EQUAL_LENGTH) or constrain individual endpoints with SYMMETRY on point pairs.
+- **`getPositions` returns null for circles.** To read a circle's center position, use `getPoints({id: circleId}).result.centerId`, then `getPositions({id: centerId})`.
+- **Constraint deletion doesn't undo geometry changes.** After deleting a constraint, geometry stays where the solver moved it. There is no automatic revert.
```
