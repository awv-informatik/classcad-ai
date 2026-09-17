# part.box

Parametric box feature in a part's feature tree (unlike `solid.box`, direct geometry in an entity injection). Supports `updateBox`, expression-driven dimensions, and workCSys placement via `references`.

## Key Parameters

- `id` — **part ID** (not entity injection ID — that's `solid.box`)
- `name` — feature name (default: "Box")
- `length`, `width`, `height` — X, Y, Z dimensions. Default 100 each. Numbers or expression strings: `'@expr.W'`, inline math `'3*25'`, `'sqrt(100)'`. With `@expr.` references, changing the expression + recalc updates the box.
- `references` — array of **workCSys IDs only**; box placed at the csys origin. Empty/omitted = drawing origin

## Return Value

Feature ID (numeric), maxLevel 31. Pass it to `updateBox`, `openFeature`, `closeFeature`, etc.

## Alignment

**Corner-aligned at the origin**: extends from `(0,0,0)` to `(+length, +width, +height)`, COG at `(L/2, W/2, H/2)`. Measured with 100×80×60: vertex 0 at `(0,0,0)`, COG `(50,40,30)`.

**Differs from `solid.box`**, which is centered (corners at `±L/2, ±W/2, ±H/2`). When mixing both families in one part, translate one to overlay them. See `feature-vs-direct.md`.

## Gotchas

- **Unknown parameters are SILENTLY IGNORED**: `xPosition`/`zPosition`/`translation` do not exist — box lands at the origin with no warning (COG-verified). Position only via `references: [workCSysId]`.
- **`references` only accepts `workcsys` IDs** ("reference of the work coordinate system" means literally a workCSys). Work plane/axis/point ID → error 1001.
- **Zero/negative dimensions create degenerate features**: returns a feature ID with maxLevel 51 and error 1122; the feature exists but has no valid geometry. Validate dims > 0.
- Multiple boxes in one part are fine — each is a separate feature with its own body (renderer colors each body distinctly).
- `updateBox({ name })` renames the feature node; the internal body child keeps the original name suffixed `_0`.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 1001 | "wrong id type! Provide only following id types: ['workcsys']" | Non-workCSys ID in `references` |

## updateBox

Full details: `updateBox.md`. Wrap in `openFeature`/`closeFeature` (without `openFeature`: null + errors 1200 + 1004). `id` = feature ID; returns feature ID on success, null on failure (not VOID). Omitted params keep values; multiple calls within one open/close all apply; `@expr.`/inline math supported; `references: [wcsId]` adds, `[]` removes placement; geometry regenerates on `closeFeature` (no `recalc` needed).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const wcsId = (await api.v1.part.workCSys({ id: partId, name: 'WCS1', offset: [50, 0, 0] })).result

const boxId = (await api.v1.part.box({
  id: partId, name: 'Box1', references: [wcsId],
  length: 60, width: 40, height: 30,
})).result
await api.v1.part.box({ id: partId, length: '3*25', height: 'sqrt(2500)' }) // inline math

await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, height: 80 })
await api.v1.part.closeFeature({ id: boxId })
```

## part.box vs solid.box

| | `part.box` | `solid.box` |
|---|---|---|
| Container | Part (feature tree) | Entity injection |
| `id` param | Part ID | Entity injection ID |
| ID type returned | feature | solid |
| Update API | `updateBox` (via open/close) | None (use `solid.translation`/`rotation`/`scale`) |
| Positioning | `references` (workCSys) | `translation`, `rotation`, `rotateFirst` |
| Expressions | `@expr.` syntax in dims | ❌ strictly `real` only |
| Boolean system | `part.boolean` (feature IDs only) | `solid.*` booleans (solid IDs only) |
| Mass properties | Via part ID (feature ID rejected) | Via solid ID or part ID |
| Feature tree | Yes — full parametric history | No — flat inside EIF |
| Cross-paradigm | Cannot mix in booleans | Cannot mix in booleans |

See `feature-vs-direct.md` for a full comparison.

## Related

`part.updateBox` · `part.openFeature` / `part.closeFeature` · `part.workCSys` · `solid.box`
