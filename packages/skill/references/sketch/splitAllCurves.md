# sketch.splitAllCurves

Deprecated in the API — use [sketch.preTrim](preTrim.md).

Still works (maxLevel 31, no deprecation message). It is step 1 of the old chain `splitAllCurves → trimCurves → splitCurvesMergeBack` and stages exactly like `preTrim`: same cut points, same segment names (`<CurveName>_part<N>`), same `SplittedCurves`/`NoneSplitted` containers. Old and new steps mix freely (`splitAllCurves → trim → postTrim` gives the same geometry as the pure chains).

## Differences from preTrim

- **The result is a flat array of the produced segment ids, nothing else.** For example `[80, 84, 88, 92]` for two crossing lines. There is no `sourceId` and no `interval`.
- **Curves that were not split are left out.** They are still staged in `NoneSplitted`, but they do not appear in the result. If no curves cross, the result is `[]` at maxLevel 31. `preTrim` lists every curve, and an unsplit one comes back with `id === sourceId`.
- To find which segment is which, use `getPositions` on the segment ids (it works mid-workflow) or the segment name from the tree. **The two arcs of a split circle share both endpoints**, so only their start/end order tells them apart: `(100,40)-(80,60)` was the 270° arc and `(80,60)-(100,40)` the 90° arc. `preTrim`'s `interval` gives this directly.
- **No subset.** A `curveIds` param is silently ignored (maxLevel 31): every curve is split and every curve cuts. `preTrim({ id, curveIds })` honours the subset.
- Errors are the same as preTrim's: 1004 when `id` is missing, 1001 `["sketch"]` for a wrong id type, 1006 for an unknown id. Calling it twice without a merge kills the first batch's ids and leaves an empty `NoneSplitted0` behind, as preTrim does.

## Replacement

```js
const pre = await api.v1.sketch.preTrim({ id: skId })   // was splitAllCurves({ id: skId })
const segs = (src) => pre.result.find((e) => e.sourceId === src).splittedCurves // [{ id, interval }]
```

Then `trim` the unwanted segment ids and finish with `postTrim`. The workflow is in [preTrim.md](preTrim.md).

## Related

[trimCurves.md](trimCurves.md) · [splitCurvesMergeBack.md](splitCurvesMergeBack.md) · [trim.md](trim.md) · [postTrim.md](postTrim.md)
