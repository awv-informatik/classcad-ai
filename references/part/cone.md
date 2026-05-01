# part.cone

Creates a parametric cone (frustum) feature inside a part. Unlike `solid.cone` (direct geometry in an entity injection), `part.cone` lives in the feature tree, supports `updateCone`, expression-driven dimensions, and work coordinate system placement via `references`.

## Prerequisites

- A part (`part.create`)

## Key Parameters

- `id` — **part ID** (not entity injection ID — that's `solid.cone`)
- `name` — feature name in the design tree (default: "Cone")
- `bDiameter` — bottom diameter (default: 50). Must be > 0.
- `tDiameter` — top diameter (default: 0.1). Must be > 0. **Cannot be 0** — true cone apex is not supported.
- `height` — height in Z direction (default: 100). Must be > 0.
- `references` — array of **workCSys IDs only**. Places the cone at the coordinate system's origin. Empty array or omitted = drawing origin.

All dimension params accept numbers or expression strings (`'@expr.BD'`, `'4*20'`, `'sqrt(100)'`).

## Return Value

Feature ID (numeric) on success, with maxLevel 31 (info). The feature ID is what you pass to `updateCone`, `openFeature`, `closeFeature`, and other feature-targeting APIs.

## Alignment

The cone is **base-anchored at the origin** — base disk centered on the XY plane at z=0, top disk at z=`+height`. COG of a frustum sits along the Z-axis biased toward the larger end. Verified empirically with `bDiameter=tDiameter=40, height=80`: vertex 0 at `(20, 0, 0)`, COG at `(0, 0, 39.99)`.

**This is different from `solid.cone`**, which is fully centered (z extends `-H/2..+H/2`). See `feature-vs-direct.md` for the full conventions table.

## Gotchas

- **`tDiameter` cannot be 0.** The default 0.1 exists because a true cone point is invalid. Error 1122: "Value for top diameter must be greater than 0."
- **All dimensions must be > 0.** Zero or negative values for any of bDiameter, tDiameter, height produce error 1122 but still create a degenerate feature (feature ID returned, no valid geometry).
- **`references` only accepts workCSys IDs.** Passing a work plane, work axis, or work point ID fails with error 1001: "wrong id type! Provide only following id types: ['workcsys']".
- **`tDiameter > bDiameter` is valid** — produces an inverted cone (wider at top).
- **`tDiameter = bDiameter` is valid** — produces a cylinder. Use `part.cylinder` instead if this is the intent.
- **`getExpression` does not read cone feature members.** The params (bDiameter, tDiameter, height) are visible in the structure tree but not accessible via `getExpression`. Use the structure tree to verify values.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1122 | "Value for [param] must be greater than 0" | Zero or negative dimension |
| 1001 | "wrong id type! Provide only following id types: ['workcsys']" | Passed a non-workCSys ID in `references` |

## updateCone

Updates an existing cone feature's dimensions, name, or references. Requires the open/close pattern.

```js
await api.v1.part.openFeature({ id: coneId })
await api.v1.part.updateCone({ id: coneId, height: 200 })
await api.v1.part.closeFeature({ id: coneId })
```

- `id` — the **feature ID** returned by `part.cone` (not the part ID)
- Returns feature ID on success, null on failure
- Omitted params keep their existing values (partial update confirmed)
- Supports `@expr.NAME` references and inline math in dimension params
- Can add (`references: [wcsId]`) or remove (`references: []`) coordinate system placement
- Can rename the feature via `name` param
- Geometry regenerates on `closeFeature` — no separate `recalc` needed
- Without `openFeature`: returns null with errors 1200 + 1004

## Expression-Driven Dimensions

Both `@expr.NAME` references and inline math work at creation and update:

```js
// At creation
await api.v1.part.cone({ id: partId, bDiameter: '@expr.BD', tDiameter: '@expr.TD', height: '@expr.H' })

// At update
await api.v1.part.openFeature({ id: coneId })
await api.v1.part.updateCone({ id: coneId, bDiameter: '@expr.BD' })
await api.v1.part.closeFeature({ id: coneId })
```

When using `@expr.` references, updating the expression + recalc automatically changes the cone dimensions.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Optional: create a WCS for positioning
const wcsId = (await api.v1.part.workCSys({
  id: partId, name: 'WCS1',
  origin: [50, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

// Create cone at WCS position
const coneId = (await api.v1.part.cone({
  id: partId, name: 'Cone1',
  references: [wcsId],
  bDiameter: 60, tDiameter: 10, height: 80,
})).result

// Update dimensions later
await api.v1.part.openFeature({ id: coneId })
await api.v1.part.updateCone({ id: coneId, bDiameter: 100, tDiameter: 30, height: 150 })
await api.v1.part.closeFeature({ id: coneId })
```

## Related

- `part.updateCone` — modify after creation
- `part.openFeature` / `part.closeFeature` — required before/after any update
- `part.workCSys` — create coordinate systems for `references`
- `solid.cone` — direct (non-parametric) cone in entity injection
- `part.cylinder` — if you need equal top/bottom diameters
