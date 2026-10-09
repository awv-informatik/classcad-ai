# part.cylinder

Parametric cylinder feature in a part's feature tree (unlike `solid.cylinder`, direct geometry in an entity injection). Supports `updateCylinder`, expression-driven dimensions, and workCSys placement via `references`.

## Key Parameters

- `id` — **part ID** (not entity injection ID — that's `solid.cylinder`)
- `name` — feature name (default: "Cylinder")
- `diameter` — default 100, > 0
- `height` — along Z, default 100, > 0
- `references` — array of **workCSys IDs only**; cylinder placed at the csys origin. Empty/omitted = drawing origin

Dimensions accept numbers or expression strings (`'@expr.D'`, `'4*20'`, `'sqrt(100)'`). With `@expr.` references, `part.updateExpression` updates the cylinder at once (no recalc).

## Return Value

Feature ID (numeric), maxLevel 31. Pass it to `updateCylinder`, `openFeature`, `closeFeature`, etc.

## Alignment

**Base-anchored**: axis on Z, XY-centered, Z from `0` to `+height`. COG `(0,0,H/2)`. Measured with `diameter=30, height=100`: vertex 0 at `(15,0,0)`, COG `(0,0,49.99)`.

**Differs from `solid.cylinder`**, which is centered (z from `-H/2` to `+H/2`). For a through-hole in a plate centered at z=0, place a workCSys at z=`-H/2` (or use `solid.cylinder`). See `feature-vs-direct.md`.

## Gotchas

- **Unknown parameters are SILENTLY IGNORED**: `xPosition`/`zPosition`/`translation` do not exist — cylinder lands at the origin with no warning. Position only via `references: [workCSysId]`.
- **`references` only accepts `workcsys` IDs** ("reference of the work coordinate system" means literally a workCSys). Work plane/axis/point → error 1001.
- **The cylinder follows the workCSys ORIENTATION**: axis = csys z. `rotation: [0, Math.PI/2, 0]` (z → world +X) gives a cylinder along +X. Measured: csys `offset [30,40,20]` + `rotation [0,π/2,0]`, d=12 h=50 → COG (54.96, 40.01, 20.01), i.e. base at the offset point, axis +X. `offset` is in WORLD coordinates (rotation pivots about the csys origin, it does not rotate the offset).
- **`workCSys` takes `offset` + `rotation` (Euler radians) — NOT `origin`/`xDirection`/`yDirection`.** Those are silently ignored (no error, maxLevel 31), leaving an identity csys at the world origin — the mistake is invisible until you measure. See `workCSys.md`.
- **Zero/negative dimensions create degenerate features**: feature ID returned with maxLevel 51 and error 1122; no valid geometry. Validate dims > 0.
- Multiple cylinders in one part are fine — each is a separate feature with its own body (distinct render colors).

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 1001 | "wrong id type! Provide only following id types: ['workcsys']" | Non-workCSys ID in `references` |

## updateCylinder

Full details: `updateCylinder.md`. Wrap in `openFeature`/`closeFeature` (without `openFeature`: null + errors 1200 + 1004). `id` = feature ID; returns feature ID on success, null on failure (not VOID). Omitted params keep values; multiple calls within one open/close all apply; `@expr.`/inline math supported; `references: [wcsId]` adds, `[]` removes placement; geometry regenerates on `closeFeature` (no `recalc` needed).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const wcsId = (await api.v1.part.workCSys({
  id: partId, name: 'WCS1',
  offset: [50, 0, 0],            // world coords
  rotation: [0, Math.PI / 2, 0], // Euler radians; csys z → world +X
})).result

// Base at (50,0,0), axis along world +X
const cylId = (await api.v1.part.cylinder({
  id: partId, name: 'Cyl1', references: [wcsId], diameter: 60, height: 120,
})).result
await api.v1.part.cylinder({ id: partId, diameter: '4*20', height: 'sqrt(10000)' }) // inline math

await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, diameter: 100, height: 200 })
await api.v1.part.closeFeature({ id: cylId })
```

## part.cylinder vs solid.cylinder

| | `part.cylinder` | `solid.cylinder` |
|---|---|---|
| Container | Part (feature tree) | Entity injection |
| `id` param | Part ID | Entity injection ID |
| Update API | `updateCylinder` (via open/close) | None |
| Positioning | `references` (workCSys) | `translation`, `rotation` |
| Expressions | `@expr.` syntax in dims | Not supported |
| Feature tree | Yes — full parametric history | No — direct geometry |
| Use when | Parametric modeling, design intent | Direct geometry manipulation |

## Related

`part.updateCylinder` · `part.openFeature` / `part.closeFeature` · `part.workCSys` · `solid.cylinder`
