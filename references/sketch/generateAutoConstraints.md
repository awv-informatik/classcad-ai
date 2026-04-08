# sketch.generateAutoConstraints

Automatically generates geometric constraints for a single sketch geometry element. Detects fixation at origin, horizontal/vertical alignment, coincidence with existing geometry, and tangency between curves.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create`)
- At least one sketch geometry element (line, circle, arc, point)

## Key Parameters

- **`id`** (required) — sketch ID.
- **`geomId`** (required) — ID of the sketch geometry to constrain. Accepts **sketch-curve** or **sketch-point** IDs only. **Does NOT accept the sketch ID itself** despite the source docs suggesting otherwise — passing a sketch ID gives error 1001: "wrong id type".
- **`genFixation`** (optional, default true) — generate fixation constraint if any point of the geometry is at the sketch origin (0,0,0).
- **`genIncidence`** (optional, default true) — generate coincidence constraints between overlapping/coincident points across geometries.
- **`genTangency`** (optional, default true) — generate tangency constraints between curves (e.g., arc tangent to a line).
- **`genVertAndHoriz`** (optional, default true) — generate horizontal/vertical constraints for exactly-aligned lines.

## Return Value

Always returns `null` (not a constraint ID). maxLevel=31 on success. The constraints are added as children of the sketch in the structure tree.

## What Gets Generated

| Condition | Constraint class | Auto-name |
|---|---|---|
| Any point of geometry at exact origin (0,0,0) | `CC_2DFixationConstraint` | `Auto_Fix` |
| Line exactly horizontal (all Y identical) | `CC_2DHorizontalConstraint` | `Auto_H` |
| Line exactly vertical (all X identical) | `CC_2DVerticalConstraint` | `Auto_V` |
| Point overlaps another geometry's point | `CC_2DCoincidentConstraint` | `Auto_Coinc` |
| Arc tangent to a line/curve at shared point | `CC_2DTangentSketchConstraint` | `Auto_Tan` |

Auto-names de-duplicate with numeric suffix: `Auto_Fix`, `Auto_Fix0`, `Auto_Fix1`, etc.

## Gotchas

- **Boolean flags must be JS `false`/`true`.** Passing string `'FALSE'` or `'TRUE'` causes error (maxLevel=51). Use `genFixation: false`, not `genFixation: 'FALSE'`.
- **Sketch ID not accepted as geomId.** The source docs say you can pass the sketch ID to constrain all objects — this is wrong. You must pass individual geometry IDs and call the API once per geometry.
- **Only exact alignment detected.** A line at 1° off horizontal does NOT get a HORIZONTAL constraint. Both endpoints must have identical Y coordinates.
- **Fixation requires exact origin.** A point at (0.001, 0, 0) does NOT trigger fixation. Must be exactly (0, 0, 0).
- **Fixation checks all points.** A line ending at origin (not starting) still gets fixation on the end point.
- **Idempotent.** Calling twice on the same geometry produces no duplicate constraints. Redundancy detection works correctly.
- **No return ID.** Unlike `sketch.constraint` which returns a constraint ID, this returns `null`. You cannot get the ID of the generated constraint from the return value — inspect `r.structure` to find new constraint objects.

## Common Errors

- **Error 1001** — wrong geomId type. You passed a sketch ID, part ID, or other non-geometry ID. Must be sketch-curve or sketch-point.
- **maxLevel=51 with boolean flags** — you used string `'FALSE'`/`'TRUE'` instead of JS `false`/`true`.

## Usage Hints

- To auto-constrain all geometry in a sketch, loop over each geometry ID:
  ```js
  for (const geomId of allGeomIds) {
    await api.v1.sketch.generateAutoConstraints({ id: skId, geomId })
  }
  ```
- When creating geometry with `sketch.line`, `sketch.circle`, etc., those APIs have their own `genFixation`, `genVertAndHoriz`, `genIncidence`, `genTangency` flags that run auto-constraints at creation time. Use `generateAutoConstraints` only when you need to re-run auto-detection after the fact (e.g., after moving geometry).
- Disable all flags to prevent any auto-constraint generation: `{ genFixation: false, genVertAndHoriz: false, genIncidence: false, genTangency: false }`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const skId = (await api.v1.sketch.create({ id: partId })).result

// Create lines without auto-constraints
const l1 = (await api.v1.sketch.line({
  id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0],
  genFixation: false, genVertAndHoriz: false,
})).result

// Later, generate auto-constraints
const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l1 })
// r.result → null
// r.maxLevel → 31
// Structure now contains Auto_Fix (origin) + Auto_H (horizontal)
```

## Related

- `sketch.constraint` — manually create specific constraint types
- `sketch.line` / `sketch.circle` / `sketch.rectangle` — geometry creation APIs with built-in auto-constraint flags
- `sketch.dimension` — dimensional constraints (RADIUS, OFFSET, ANGLE, etc.)
