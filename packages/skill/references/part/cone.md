# part.cone

Parametric cone (frustum) feature in a part's feature tree (unlike `solid.cone`, direct geometry in an entity injection). Supports `updateCone`, expression-driven dimensions, and workCSys placement via `references`.

## Key Parameters

- `id` — **part ID** (not entity injection ID — that's `solid.cone`)
- `name` — feature name (default: "Cone")
- `bDiameter` — bottom diameter (default 50), > 0
- `tDiameter` — top diameter (default 0.1), > 0. **Cannot be 0** — a true apex is not supported (hence the 0.1 default)
- `height` — Z height (default 100), > 0
- `references` — array of **workCSys IDs only**; cone placed at the csys origin and follows its orientation (axis = csys z). Empty/omitted = drawing origin

Dimensions accept numbers or expression strings (`'@expr.BD'`, `'4*20'`, `'sqrt(100)'`) at creation and update. With `@expr.` references, changing the expression + recalc updates the cone.

## Return Value

Feature ID (numeric), maxLevel 31. Pass it to `updateCone`, `openFeature`, `closeFeature`, etc.

## Alignment

**Base-anchored**: base disk centered on XY at z=0, top disk at z=`+height`. COG lies on the Z-axis, biased toward the larger end. Measured with `bDiameter=tDiameter=40, height=80`: vertex 0 at `(20,0,0)`, COG `(0,0,39.99)`.

**Differs from `solid.cone`**, which is centered (z from `-H/2` to `+H/2`). See `feature-vs-direct.md`.

## Gotchas

- **Any dimension ≤ 0** (incl. `tDiameter: 0`) → error 1122 (e.g. "Value for top diameter must be greater than 0.") but still creates a degenerate feature (feature ID returned, no valid geometry).
- **`references` only accepts workCSys IDs** — work plane/axis/point → error 1001.
- `tDiameter > bDiameter` is valid (inverted cone). `tDiameter = bDiameter` is valid (a cylinder — use `part.cylinder` for that intent).
- **`getExpression` does not read cone feature members** (bDiameter, tDiameter, height). They are visible in the structure tree — verify values there.
- `workCSys` takes `offset` + `rotation`, NOT `origin`/`xDirection` (silently ignored; see `workCSys.md`).

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 1001 | "wrong id type! Provide only following id types: ['workcsys']" | Non-workCSys ID in `references` |

## updateCone

Wrap in `openFeature`/`closeFeature` (without `openFeature`: null + errors 1200 + 1004). `id` = feature ID from `part.cone`. Returns feature ID on success, null on failure. Omitted params keep values (partial update confirmed); `name` renames; `@expr.`/inline math supported; `references: [wcsId]` adds, `[]` removes placement; geometry regenerates on `closeFeature` (no `recalc` needed).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const wcsId = (await api.v1.part.workCSys({ id: partId, name: 'WCS1', offset: [50, 0, 0] })).result
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'BD', value: 100 }] })

const coneId = (await api.v1.part.cone({
  id: partId, name: 'Cone1', references: [wcsId],
  bDiameter: 60, tDiameter: 10, height: 80,
})).result

await api.v1.part.openFeature({ id: coneId })
await api.v1.part.updateCone({ id: coneId, bDiameter: '@expr.BD', tDiameter: 30, height: 150 })
await api.v1.part.closeFeature({ id: coneId })
```

## Related

`part.updateCone` · `part.openFeature` / `part.closeFeature` · `part.workCSys` · `solid.cone` · `part.cylinder`
