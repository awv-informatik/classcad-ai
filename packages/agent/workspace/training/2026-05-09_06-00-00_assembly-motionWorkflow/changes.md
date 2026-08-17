# Changes: constraint-driven motion workflow study

Updated `references/assembly/movingUnderConstraints.md` with critical corrections from workflow study.

## Key corrections:

1. **Rotation accumulates across sessions** — CORRECTS prior claim that constrained joints use constraint-zero as reference. Each session starts from the current position, and the basis is a delta.
2. **Added state machine table** — complete mapping of safe vs dangerous transitions.
3. **transformInstance on constrained instances** — API call succeeds but constraint solver snaps position back.

```diff
-Each `moveUnderConstraints` call sets the position **from where the instance was at `startMoving` time**. Calling it twice with the same rotation replaces (not accumulates). To animate through multiple angles, use a single session and call move with increasing angles.
-
-For **constrained** joints, the rotation basis vectors appear to be interpreted relative to the constraint's zero position, not relative to the session start. Applying the same basis in a new session from an already-rotated position does NOT accumulate rotation.
+Each `moveUnderConstraints` call sets the position **from where the instance was at `startMoving` time**. Calling it twice with the same rotation replaces (not accumulates). Within a single session, each move is absolute from the session-start position.
+
+### Rotation accumulates across sessions
+
+Each new `start → move → finish` session starts from the instance's **current position** (wherever finish left it). The rotation basis vectors in `moveUnderConstraints` are applied as a **delta from session start**, not from the constraint's zero position. This means:
+
+- Session 1: 30° basis from 0° → instance at 30°
+- Session 2: 30° basis from 30° → instance at 60° (not 30°)
+- Identity rotation (no-op basis) keeps the instance at session start — it does NOT return to constraint zero

+- **transformInstance has no lasting effect on constrained instances.**

+## State Machine
+| idle → move | ❌ | **Worker hang** (100% CPU) |
+| idle → finish | ❌ | **Worker hang** (100% CPU) |
```
