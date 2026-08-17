# part.cylinder

Creates a parametric cylinder feature inside a part. Unlike `solid.cylinder` (which creates direct geometry in an entity injection), `part.cylinder` lives in the feature tree, supports `updateCylinder`, expression-driven dimensions, and work coordinate system placement via `references`.

## Prerequisites

- A part (`part.create`)

## Key Parameters

- `id` — **part ID** (not entity injection ID — that's `solid.cylinder`)
- `name` — feature name in the design tree (default: "Cylinder")
- `diameter` — cylinder diameter (default: 100). Must be > 0. Accept numbers or expression strings (`'@expr.D'`, `'4*20'`, `'sqrt(100)'`)
- `height` — height in Z direction (default: 100). Must be > 0. Same expression support as diameter.
- `references` — array of **workCSys IDs only**. Places the cylinder at the coordinate system's origin. Empty array or omitted = drawing origin.

## Return Value

Feature ID (numeric) on success, with maxLevel 31 (info). The feature ID is what you pass to `updateCylinder`, `openFeature`, `closeFeature`, and other feature-targeting APIs.

## Alignment

The cylinder is **base-anchored at the origin** — XY centered (axis on Z), but Z extends from `0` to `+height`. COG sits at `(0, 0, H/2)`. Verified empirically with `diameter=30, height=100`: vertex 0 at `(15, 0, 0)`, COG at `(0, 0, 49.99)`.

**This is different from `solid.cylinder`**, which is fully centered at the origin (z extends `-H/2..+H/2`). For a through-hole on a plate centered at z=0, a `part.cylinder` needs a workCSys placed at z=`-H/2` (or use `solid.cylinder` instead, which centers naturally). See `feature-vs-direct.md` for the full conventions table.

## Gotchas

- **Unknown parameters are SILENTLY IGNORED** (verified 2026-08-17): `xPosition`/`zPosition`/`translation` do not exist — the cylinder lands at the origin with no warning (COG-verified). Position exclusively via `references: [workCSysId]`.
- **`references` only accepts `workcsys` IDs.** Passing a work plane, work axis, or work point ID fails with error code 1001: "wrong id type! Provide only following id types: ['workcsys']". The docs say "reference of the work coordinate system" — it means literally a workCSys.
- **The cylinder follows the workCSys ORIENTATION, not just its origin.** The cylinder axis aligns with the csys z-axis. A csys with `rotation: [0, Math.PI/2, 0]` (z → world +X) produces a cylinder along +X. Verified 2026-06-10: csys `offset [30,40,20]` + `rotation [0, π/2, 0]`, cylinder d=12 h=50 → COG (54.96, 40.01, 20.01), i.e., base at the offset point, axis +X. `offset` is applied in WORLD coordinates (the rotation pivots about the csys origin, it does not rotate the offset).
- **`workCSys` takes `offset` + `rotation` (Euler radians) — NOT `origin`/`xDirection`/`yDirection`.** Those param names are silently ignored (no error, maxLevel 31), leaving an identity csys at the world origin — the cylinder then lands at the drawing origin and the mistake is invisible until you measure. See `workCSys.md`.
- **Zero/negative dimensions create degenerate features.** The call returns a feature ID but with maxLevel 51 (ERROR) and code 1122: "Value for [param] must be greater than 0." The feature exists in the tree but has no valid geometry. Always validate dimensions > 0.
- **Multiple cylinders in one part are fine.** Each creates a separate feature with its own body. The renderer assigns distinct colors per body.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 1001 | "wrong id type! Provide only following id types: ['workcsys']" | Passed a non-workCSys ID in `references` |

## updateCylinder

Updates an existing cylinder feature's dimensions, name, or references. See `references/part/updateCylinder.md` for full details.

**Requires the open/close pattern:**
```js
await api.v1.part.openFeature({ id: cylId })
await api.v1.part.updateCylinder({ id: cylId, diameter: 80 })
await api.v1.part.closeFeature({ id: cylId })
```

- `id` — the **feature ID** returned by `part.cylinder` (not the part ID)
- Returns feature ID on success, null on failure (not VOID)
- Omitted params keep their existing values (partial update)
- Multiple updateCylinder calls within a single open/close all apply
- Supports `@expr.NAME` references and inline math in dimension params
- Can add (`references: [wcsId]`) or remove (`references: []`) coordinate system placement
- Geometry regenerates on `closeFeature` — no separate `recalc` needed
- Without `openFeature`: returns null with errors 1200 + 1004

## Expression-Driven Dimensions

Both `@expr.NAME` references and inline math work:

```js
// Named expression references
await api.v1.part.cylinder({ id: partId, diameter: '@expr.D', height: '@expr.H' })

// Inline math
await api.v1.part.cylinder({ id: partId, diameter: '4*20', height: 'sqrt(10000)' })
```

When using `@expr.` references, updating the expression + recalc automatically changes the cylinder dimensions.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Optional: create a WCS for positioning (params: offset + rotation — NOT origin/xDirection!)
const wcsId = (await api.v1.part.workCSys({
  id: partId, name: 'WCS1',
  offset: [50, 0, 0],            // world coords
  rotation: [0, Math.PI / 2, 0], // Euler radians; csys z → world +X
})).result

// Cylinder base at (50,0,0), axis along world +X (follows csys orientation)
const cylId = (await api.v1.part.cylinder({
  id: partId, name: 'Cyl1',
  references: [wcsId],
  diameter: 60, height: 120,
})).result

// Update dimensions later
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

- `part.updateCylinder` — modify after creation
- `part.openFeature` / `part.closeFeature` — required before/after any update
- `part.workCSys` — create coordinate systems for `references`
- `solid.cylinder` — direct (non-parametric) cylinder in entity injection
