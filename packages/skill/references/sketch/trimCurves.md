# sketch.trimCurves

Deprecated in the API — use [sketch.trim](trim.md).

Still works (maxLevel 31, no deprecation message). It runs the same engine routine as `trim`: trim's own error text names `SketcherHelper.TrimCurves`. Every probe gave identical results for the two methods, and either one works after `splitAllCurves` or `preTrim` and before `splitCurvesMergeBack` or `postTrim`.

## Behaviour (same as trim)

- It acts at once. A trimmed segment's id is dead as soon as the call returns.
- **An unsplit curve's id deletes the whole curve.** This is a curve staged in `NoneSplitted`, which preTrim reports with `id === sourceId`.
- The original id of a curve that **was** split is a silent no-op (maxLevel 31). Any id is a no-op when nothing is staged.
- `[]` does nothing. An unknown id fails with 1006 and nothing is removed. A wrong id type fails with 1001 `["sketch-curve"]`. A missing `curveIds` fails with 1004.
- **A duplicate id is not atomic.** The call fails at maxLevel 51 with `SketcherHelper.TrimCurves: objId not found`, but the ids before the second occurrence are already trimmed. `[a,a,b]` removes a and keeps b; `[b,a,a]` removes both.

No difference from `trim` was found, so switching is a rename.

## Replacement

```js
await api.v1.sketch.trim({ id: skId, curveIds: segIds }) // was trimCurves({ id: skId, curveIds: segIds })
```

## Related

[splitAllCurves.md](splitAllCurves.md) · [splitCurvesMergeBack.md](splitCurvesMergeBack.md) · [preTrim.md](preTrim.md) · [postTrim.md](postTrim.md)
