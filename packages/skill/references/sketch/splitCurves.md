# sketch.splitCurves

Deprecated in the API — use [sketch.splitCurve](splitCurve.md).

Still works (maxLevel 31, no deprecation message). Run on the same input, it behaves like `splitCurve`:

- the same cut points and segment names (`Split_Line`, `Split_Line0`, …, `Split_Arc`)
- the same `Split_Coinc` constraints
- the original id is destroyed, and there is no staging (`splitCurvesMergeBack` does not undo it)
- the same validation: a circle needs at least 2 values (`Circle shouldn't be split at a single point!`), 1001 `["sketch-curve"]` for a wrong `geomId` type, 1006 for an unknown id

## Differences from splitCurve

- **The result is nested, not flat:** one id array per `splits` entry, in input order, for example `[[69, 73, 77], [81, 86]]` for a line `[0.25,0.75]` plus a circle `[0.25,0.75]`. There is no `sourceId` and no `interval`.
- Circle values are turn fractions from +X (0.25 → 90°), the same as in `splitCurve`. The JSDoc's "0 to 2*PI for circles" is wrong.
- `values: []` returns `[[newId]]`: the id is re-issued, as in splitCurve. `splits: []` returns `[]`.

## Replacement

```js
const r = await api.v1.sketch.splitCurve({ id: skId, splits: [{ geomId: line, values: [0.25, 0.75] }] })
const ids = r.result.map((e) => e.splittedCurves.map((s) => s.id)) // the old nested shape, if code expects it
```

## Related

[splitCurve.md](splitCurve.md) · [preTrim.md](preTrim.md) (cut at intersections instead)
