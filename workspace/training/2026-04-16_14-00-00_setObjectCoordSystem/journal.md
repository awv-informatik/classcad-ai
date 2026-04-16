# Training: common.setObjectCoordSystem

**Date:** 2026-04-16

## Goal

Testing `v1.common.setObjectCoordSystem` — sets a new coordinate system (origin + x/y direction vectors) on an object.

**Methods to cover:**

- `setObjectCoordSystem` — params: id, origin, xVec, yVec
- Effect on different object types: parts, sketches, entity injections, solids, work geometry
- Interaction with existing geometry (does it move geometry or just set metadata?)
- Relationship to `transformObjectWithMatrix`

**Questions:**

- What object types accept setObjectCoordSystem? (parts, sketches, EIFs, solids, work geometry?)
- Does it physically reposition geometry or just set a local coordinate frame?
- What happens if xVec and yVec are not orthogonal?
- What happens with zero-length vectors?
- Can you read back the coord system after setting it?
- Does it affect child objects?
