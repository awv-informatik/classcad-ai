# sketch.splitCurvesMergeBack

Deprecated in the API — use [sketch.postTrim](postTrim.md).

Still works (maxLevel 31, result VOID, no deprecation message). It is step 3 of the old chain `splitAllCurves → trimCurves → splitCurvesMergeBack`. It finalizes a `preTrim` staging, and `postTrim` finalizes a `splitAllCurves` staging; the two are interchangeable.

## Same result as postTrim

- **Geometry:** the final positions were equal on two crossing lines (L corner) and on a rectangle with a crossing line and a corner circle.
- **Ids:** curves that were not trimmed keep their ids, and every trimmed source gets a new id.
- **Constraints:** they are recreated under the same names (`Auto_H` becomes `Auto_H0`, plus `Auto_Coinc` at the cut).
- **Staging:** the `SplittedCurves`/`NoneSplitted` containers are removed.
- **No-trim round trip:** the original ids and positions come back.
- **Nothing staged:** the call is a no-op at maxLevel 31. It does **not** undo a `splitCurves`/`splitCurve` split.
- **Errors:** the same as postTrim's (1004 missing `id`, 1001 `["sketch"]` wrong id type, 1006 unknown id).

## Replacement

```js
await api.v1.sketch.postTrim({ id: skId }) // was splitCurvesMergeBack({ id: skId })
```

## Related

[splitAllCurves.md](splitAllCurves.md) · [trimCurves.md](trimCurves.md) · [preTrim.md](preTrim.md) · [trim.md](trim.md)
