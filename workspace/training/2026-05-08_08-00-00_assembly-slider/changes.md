# Changes — assembly.slider training

## New file: `references/assembly/slider.md`

```diff
+# assembly.slider
+
+Creates a slider constraint between two instances. Allows 1 degree of freedom: translation along the Z-axis. All other DOFs are locked — X/Y translation fixed by offset params, all rotation fixed.
+
+## Prerequisites
+
+- An assembly root (`assembly.create`)
+- At least two instances (`assembly.instance`) with work coordinate systems (`part.workCSys`) in their templates
+- **Ground at least one instance** with `fastenedOrigin` before applying slider — otherwise the solver repositions BOTH instances
+
+## Key Parameters
+
+- `id` — assembly root ID (required)
+- `mate1` / `mate2` — each needs `path: [instanceId]` and `csys: workCSysId`
+- `xOffset` — fixed X position of inst2 relative to mate1's csys (default=0). NOT a range — a single value.
+- `yOffset` — fixed Y position of inst2 relative to mate1's csys (default=0). NOT a range — a single value.
+- `zOffsetLimits` — `{ min, max }` constraining the free Z-translation DOF. Omit for unbounded Z.
+- `mate.flip` — `'Z'` (default), `'-Z'`, `'X'`, `'-X'`, `'Y'`, `'-Y'`. Reorients inst2 before constraint solving.
+- `mate.reorient` — `'0'` (default), `'90'`, `'180'`, `'270'`. Always visible because rotation DOF is locked.
```

Full file is 206 lines covering: alignment semantics, DOF behavior, xOffset/yOffset fixed positions, zOffsetLimits clamping, flip table, reorient (always visible on slider), getSlider return structure, updateSlider partial updates, removing limits preserves position, error table, working example, and related APIs.
