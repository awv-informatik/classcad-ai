# Changes — 2D Boolean Operations

## New file: `references/curve/union2d.md`

```diff
+# curve.union2d / subtraction2d / intersection2d
+
+2D boolean operations on shape containers. Merges, subtracts, or intersects two closed 2D shapes within entity injections.
+
+All three APIs share identical signatures and behavior patterns — they differ only in the geometric operation performed.
+
+## Prerequisites
+
+- Two shapes (`curve.shape`) each containing **closed curves** (circles, closed polylines, closed advancedPolylines)
+- Shapes must be **coplanar** (same plane)
+- Both shapes must have at least one curve — empty shapes cause NULLID errors
+
+## CRITICAL: No Snapshot Before Boolean
+
+**Calling `snapshot()` between shape creation and a 2D boolean invalidates the shapes' internal solid body references.**
+**Always perform all 2D boolean operations BEFORE any snapshot call.**
+
+## Key Parameters
+
+- `target` (required) — shape ID. Modified in-place with the boolean result.
+- `tool` (required) — shape ID. Consumed (deleted) by default.
+- `keepShape` (optional, default: `false`) — when `true`, the tool shape is preserved.
+
+## Behavior
+
+- Target modified in-place. Tool consumed by default.
+- Cross-EI booleans work. Chaining works.
+- Non-overlapping shapes succeed silently.
+
+## Gotchas
+
+- NEVER pass same ID as target and tool (crashes worker).
+- Open curves fail. Shapes must be coplanar. Empty shapes fail.
+- Snapshot before boolean causes NULLID error.
+
+## Common Errors table, Working Example, Related APIs included.
```
