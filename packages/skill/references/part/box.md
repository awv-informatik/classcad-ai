# part.box

Creates a parametric box feature inside a part. Unlike `solid.box` (which creates direct geometry in an entity injection), `part.box` lives in the feature tree, supports `updateBox`, expression-driven dimensions, and work coordinate system placement via `references`.

## Prerequisites

- A part (`part.create`)

## Key Parameters

- `id` — **part ID** (not entity injection ID — that's `solid.box`)
- `name` — feature name in the design tree (default: "Box")
- `length`, `width`, `height` — dimensions in X, Y, Z respectively. Default: 100 each. Accept numbers or expression strings (`'@expr.W'`, `'3*25'`, `'sqrt(100)'`)
- `references` — array of **workCSys IDs only**. Places the box at the coordinate system's origin. Empty array or omitted = drawing origin

## Return Value

Feature ID (numeric) on success, with maxLevel 31 (info). The feature ID is what you pass to `updateBox`, `openFeature`, `closeFeature`, and other feature-targeting APIs.

## Alignment

The box is **corner-aligned at the origin** — it extends from `(0, 0, 0)` to `(+length, +width, +height)`. COG sits at `(L/2, W/2, H/2)`. Verified empirically with `length=100, width=80, height=60`: vertex 0 at `(0, 0, 0)`, COG at `(50, 40, 30)`.

**This is different from `solid.box`**, which is fully centered at the origin (corners at `±L/2, ±W/2, ±H/2`). When mixing the two families in the same part, translate one to overlay them. See `feature-vs-direct.md` for the full conventions table.

## Gotchas

- **Unknown parameters are SILENTLY IGNORED** (verified 2026-08-17): `xPosition`/`zPosition`/`translation` do not exist — the box lands at the origin with no warning (COG-verified). Position exclusively via `references: [workCSysId]`.
- **`references` only accepts `workcsys` IDs.** Passing a work plane, work axis, or work point ID fails with error code 1001: "wrong id type! Provide only following id types: ['workcsys']". The docs say "reference of the work coordinate system" — it means literally a workCSys.
- **Zero/negative dimensions create degenerate features.** The call returns a feature ID but with maxLevel 51 (ERROR) and code 1122: "Value for [param] must be greater than 0." The feature exists in the tree but has no valid geometry. Always validate dimensions > 0.
- **Multiple boxes in one part are fine.** Each creates a separate feature with its own body. The renderer assigns distinct colors per body.
- **Feature name vs body name:** The feature name (tree node) can be changed via `updateBox({ name })`. The internal solid body child node retains the original name suffixed with `_0` — it does not get renamed.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 1001 | "wrong id type! Provide only following id types: ['workcsys']" | Passed a non-workCSys ID in `references` |

## updateBox

Updates an existing box feature's dimensions, name, or references. See `references/part/updateBox.md` for full details.

**Requires the open/close pattern:**
```js
await api.v1.part.openFeature({ id: boxId })
await api.v1.part.updateBox({ id: boxId, height: 200 })
await api.v1.part.closeFeature({ id: boxId })
```

- `id` — the **feature ID** returned by `part.box` (not the part ID)
- Returns feature ID on success, null on failure (not VOID)
- Omitted params keep their existing values (partial update)
- Multiple updateBox calls within a single open/close all apply
- Supports `@expr.NAME` references and inline math in dimension params
- Can add (`references: [wcsId]`) or remove (`references: []`) coordinate system placement
- Geometry regenerates on `closeFeature` — no separate `recalc` needed
- Without `openFeature`: returns null with errors 1200 + 1004

## Expression-Driven Dimensions

Both `@expr.NAME` references and inline math work:

```js
// Named expression references
await api.v1.part.box({ id: partId, length: '@expr.L', width: '@expr.W', height: '@expr.H' })

// Inline math
await api.v1.part.box({ id: partId, length: '3*25', height: 'sqrt(2500)' })
```

When using `@expr.` references, updating the expression + recalc automatically changes the box dimensions.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Optional: create a WCS for positioning
const wcsId = (await api.v1.part.workCSys({
  id: partId, name: 'WCS1',
  origin: [50, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

// Create box at WCS position
const boxId = (await api.v1.part.box({
  id: partId, name: 'Box1',
  references: [wcsId],
  length: 60, width: 40, height: 30,
})).result

// Update dimensions later
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

See `references/part/feature-vs-direct.md` for a comprehensive comparison.

## Related

- `part.updateBox` — modify after creation
- `part.openFeature` / `part.closeFeature` — required before/after any update
- `part.workCSys` — create coordinate systems for `references`
- `solid.box` — direct (non-parametric) box in entity injection
