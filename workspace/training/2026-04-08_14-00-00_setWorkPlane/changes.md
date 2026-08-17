# Changes — sketch.setWorkPlane training

## File: `references/sketch/setWorkPlane.md`

Updated with findings from 18 test scripts. Key additions:

```diff
+## What It Does
+
+1. Updates `planeReference` member to point to the new work plane ID
+2. Updates `coordinateSystem` — origin moves to the plane's position, axes rotate to match the plane's orientation
+3. Preserves all sketch geometry — local coordinates unchanged, world-space position changes with the plane

+- **Origin accumulates across reassignments.** When moving a sketch between planes, the origin preserves components orthogonal to the new plane's normal. Example: sketch on plane A (pos=[0,50,0]) moved to plane B (pos=[20,0,0]) → origin becomes `[20,50,0]`, not `[20,0,0]`. A fresh sketch created directly on plane B would get `[20,0,0]`. If you need a clean origin, create a new sketch on the target plane instead of moving an existing one.
+- **Cannot restore planeReference=0.** The implicit default (XY plane, planeReference=0) cannot be restored via setWorkPlane. Moving back to XY requires creating an explicit XY work plane, and planeReference will point to that plane's ID, not 0.
+- **Idempotent.** Setting setWorkPlane to the plane the sketch is already on: no change, maxLevel=31.
+- **Works with all work plane types:** USERDEFINED, PLANE-referenced (with offset), standard planes (Top/Front/Right), tilted/non-axis-aligned planes.
+- **Standard work planes** exist on every part: Top (XY), Front (XZ), Right (YZ). Use them directly with setWorkPlane.

+## Standard Work Plane Coordinate Systems
+
+| Plane | X-axis | Y-axis | Z-axis (normal) |
+|-------|--------|--------|-----------------|
+| Top (XY) | `[1,0,0]` | `[0,1,0]` | `[0,0,1]` |
+| Front (XZ) | `[1,0,0]` | `[0,0,-1]` | `[0,1,0]` |
+| Right (YZ) | `[0,1,0]` | `[0,0,1]` | `[1,0,0]` |

+| "planeId must be provided" | 1004 | Missing planeId parameter |

+### Using standard work planes
+// Parts come with Top(38), Front(42), Right(46) — find them
```
