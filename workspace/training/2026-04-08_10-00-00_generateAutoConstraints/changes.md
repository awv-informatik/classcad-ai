# Changes

New file: `references/sketch/generateAutoConstraints.md`

```diff
+# sketch.generateAutoConstraints
+
+Automatically generates geometric constraints for a single sketch geometry element. Detects fixation at origin, horizontal/vertical alignment, coincidence with existing geometry, and tangency between curves.
+
+## Prerequisites
+
+- A part (`part.create`)
+- A sketch (`sketch.create`)
+- At least one sketch geometry element (line, circle, arc, point)
+
+## Key Parameters
+
+- **`id`** (required) — sketch ID.
+- **`geomId`** (required) — ID of the sketch geometry to constrain. Accepts **sketch-curve** or **sketch-point** IDs only. **Does NOT accept the sketch ID itself** despite the source docs suggesting otherwise — passing a sketch ID gives error 1001: "wrong id type".
+- **`genFixation`** (optional, default true) — generate fixation constraint if any point of the geometry is at the sketch origin (0,0,0).
+- **`genIncidence`** (optional, default true) — generate coincidence constraints between overlapping/coincident points across geometries.
+- **`genTangency`** (optional, default true) — generate tangency constraints between curves (e.g., arc tangent to a line).
+- **`genVertAndHoriz`** (optional, default true) — generate horizontal/vertical constraints for exactly-aligned lines.
+
+## Return Value
+
+Always returns `null` (not a constraint ID). maxLevel=31 on success. The constraints are added as children of the sketch in the structure tree.
+
+## What Gets Generated
+
+| Condition | Constraint class | Auto-name |
+|---|---|---|
+| Any point of geometry at exact origin (0,0,0) | `CC_2DFixationConstraint` | `Auto_Fix` |
+| Line exactly horizontal (all Y identical) | `CC_2DHorizontalConstraint` | `Auto_H` |
+| Line exactly vertical (all X identical) | `CC_2DVerticalConstraint` | `Auto_V` |
+| Point overlaps another geometry's point | `CC_2DCoincidentConstraint` | `Auto_Coinc` |
+| Arc tangent to a line/curve at shared point | `CC_2DTangentSketchConstraint` | `Auto_Tan` |
+
+Auto-names de-duplicate with numeric suffix: `Auto_Fix`, `Auto_Fix0`, `Auto_Fix1`, etc.
+
+## Gotchas
+
+- **Boolean flags must be JS `false`/`true`.** Passing string `'FALSE'` or `'TRUE'` causes error (maxLevel=51).
+- **Sketch ID not accepted as geomId.** Doc discrepancy — must pass individual geometry IDs.
+- **Only exact alignment detected.** Near-horizontal/vertical NOT detected.
+- **Fixation requires exact origin.** Even 0.001 offset prevents fixation.
+- **Fixation checks all points.** Not just start point.
+- **Idempotent.** No duplicate constraints on repeated calls.
+- **No return ID.** Returns `null`, not a constraint ID.
+
+## Common Errors
+
+- **Error 1001** — wrong geomId type.
+- **maxLevel=51 with boolean flags** — used string 'FALSE' instead of JS false.
+
+## Usage Hints, Working Example, Related
+
+(see full file for details)
```
