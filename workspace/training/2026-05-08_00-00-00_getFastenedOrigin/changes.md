# Changes — getFastenedOrigin training session

## New file: `references/assembly/getFastenedOrigin.md`

Created dedicated LLM doc for `assembly.getFastenedOrigin` with:
- Full return value structure (all fields always present)
- Array/batch form documentation
- ID type restrictions (assembly root only, instance IDs fail at runtime)
- Deg string → radian conversion behavior
- Nonexistent name handling (null + maxLevel 51)
- Duplicate name behavior (first match wins)
- Update/rename reflection (immediate)
- useCurrentTransform offset storage
- Error table with codes

## Modified: `references/assembly/fastenedOrigin.md`

Replaced inline getFastenedOrigin section with pointer to new dedicated doc:

```diff
-Query by name. Returns full constraint state including mate1, all offsets, and all rotations.
-
-- `id` param: **assembly root ID only** — instance IDs rejected with code 1007
-- Deg strings are stored internally as radians (e.g., `'45deg'` → `0.7853981633974483`)
-- Nonexistent name: returns null, maxLevel 51
+See dedicated doc: `getFastenedOrigin.md`
```

Note: corrected the error code — was listed as 1007 in the old inline doc, but actual instance ID error is code 0 (not 1007). The code 1007 was a misattribution from a different error path.
