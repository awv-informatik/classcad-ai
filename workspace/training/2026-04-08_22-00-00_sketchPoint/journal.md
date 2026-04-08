# Training: sketch.point

**Date:** 2026-04-08

## Goal

Testing `v1.sketch.point` — creating points in a sketch.

**Methods to cover:**

- `point` — basic point creation with `pos` parameter
- `point` — `genFixation` flag (default TRUE) — controls auto-fixation constraint
- `point` — `genIncidence` flag (default TRUE) — controls auto-coincidence constraint
- `point` — batch creation (Array<object> input)
- `point` — return value (id, messages, maxLevel)
- `getPositions` — verify point position after creation
- `deleteObject` — delete a point
- `point` — edge cases: duplicate positions, 3D coords in 2D sketch, origin point, large coords

**Questions:**

- What ID type does sketch.point return? Numeric? What's the typical ID increment?
- Does genFixation=FALSE leave the point unconstrained? What constraints appear when TRUE?
- Does genIncidence create a coincidence when two points overlap?
- Can you create a point at the same position as an existing one?
- What happens with non-zero Z coordinates in a sketch on the XY plane?
- Can you create multiple points in one batch call?
- How does deleteObject work with point IDs?
