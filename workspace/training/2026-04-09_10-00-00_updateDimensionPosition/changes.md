# Changes — sketch.updateDimensionPosition training

## New file: `references/sketch/updateDimensionPosition.md`

Full LLM doc for `sketch.updateDimensionPosition`:
- Summary, prerequisites, key parameters
- Return value (VOID/null, maxLevel=31)
- All 7 dimension types confirmed working with structure class table
- Gotchas: Z must be 0, replaces auto-positioning permanently, no XY validation, feature-state independent
- Error table: codes 1001, 1014, 1004, 0+1006
- Working example, structure tree effect, related APIs

## Updated: `references/sketch/dimension.md`

Replaced the brief `updateDimensionPosition` section with a cross-reference to the new doc and key facts:

```diff
-Moves the dimension text/annotation position.
+See [updateDimensionPosition.md](./updateDimensionPosition.md) for full documentation. Key facts:

-- **`id`** — the dimension ID.
-- **`pos`** — `[x, y, z]` position.
+- **`id`** — the dimension ID (not sketch ID). Must be type `"dimension"`.
+- **`pos`** — `[x, y, z]` position. **Z must be exactly 0** (code 1014 error otherwise).
 - Returns VOID (null) with maxLevel=31 on success.
+- Works on all 7 dimension types.
+- Feature-state independent (works with open or closed features).
+- **Replaces auto-positioning permanently** — the computed `GetSE(...)` expression on `dimPt` is replaced with a literal `{x,y,z}` string.
```
