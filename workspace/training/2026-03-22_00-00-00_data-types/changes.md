# Changes — Data Types Training

## File: `references/common/generic.md`

### Point type updated (lines ~35-40)

```diff
-**`point`:** Two representations exist — **do not confuse them:**
-- **API parameters** use `[x, y, z]` arrays (e.g. `startPos: [0, 0, 0]`)
-- **API results, structure tree, and expressions** use `{x, y, z}` objects
+**`point`:** Two representations exist:
+- **API parameters** accept BOTH `[x, y, z]` arrays AND `{x, y, z}` objects
+- **API results, structure tree, and expressions** always return `{x, y, z}` objects
+- **Must be exactly 3 components.** `[x, y]`, `[x]`, `[x,y,z,w]`, and `[]` all fail
+- **Full double precision** — values preserved exactly
+- **Direction vectors** must be non-zero
```

### Expression engine expanded (lines ~142-170)

```diff
-**Functions:** `sin`, `cos`, `sqrt`, `pow`, `exp`, `ln`, etc. Constants use `C:` prefix: `C:PI`.
+**Available functions:** Full table with trig, math, log, min/max categories
+**Constants:** Only `C:PI`. `C:E` does NOT exist.
+**Degree suffix:** `Ndeg` converts degrees to radians
+**Booleans:** Added numeric arithmetic behavior (TRUE + TRUE → 2)
```

### New sections added (lines ~272-315)

- **Coordinate System** — right-handed: X-right, Y-forward, Z-up
- **Angles** — radians everywhere, `deg` suffix in expressions, no `atan2`
- **Rotation Vectors** — `[rx, ry, rz]` Euler angles, `rotateFirst` behavior
- **Transformation Matrix** — 4x4 required, column-format layout, `isGlobal` param
