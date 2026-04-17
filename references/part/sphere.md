# part.sphere

Creates a parametric sphere feature inside a part. Unlike `solid.sphere` (direct geometry in an entity injection), `part.sphere` lives in the feature tree, supports `updateSphere`, expression-driven radius, and work coordinate system placement via `references`.

## Prerequisites

- A part (`part.create`)

## Key Parameters

- `id` — **part ID** (not entity injection ID — that's `solid.sphere`)
- `name` — feature name in the design tree (default: "Sphere")
- `radius` — sphere radius (default: 100). Must be > 0. Accepts numbers or expression strings (`'@expr.R'`, `'sqrt(900)'`, `'@expr.R * @expr.factor'`)
- `references` — array of **workCSys IDs only**. Places the sphere center at the coordinate system's origin. Empty array or omitted = drawing origin

## Return Value

Feature ID (numeric) on success, with maxLevel 31 (info). The feature ID is what you pass to `updateSphere`, `openFeature`, `closeFeature`, and other feature-targeting APIs.

## Gotchas

- **`references` only accepts `workcsys` IDs.** Passing a work plane, work axis, or work point ID fails with error code 1001: "The parameter \"references\" has a wrong id type! Provide only following id types: [\"workcsys\"]". Result is null.
- **Zero/negative radius creates a degenerate feature.** The call returns a feature ID but with maxLevel 51 (ERROR) and code 1122: "Value for radius must be greater than 0." The feature exists in the tree but has no valid geometry. Always validate radius > 0.
- **Multiple spheres in one part are fine.** Each creates a separate feature with its own body.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1122 | "Value for radius must be greater than 0" | Zero or negative radius |
| 1001 | "wrong id type! Provide only following id types: ['workcsys']" | Passed a non-workCSys ID in `references` |

## updateSphere

Updates an existing sphere feature's radius, name, or references. Requires the open/close pattern.

```js
await api.v1.part.openFeature({ id: sphereId })
await api.v1.part.updateSphere({ id: sphereId, radius: 80 })
await api.v1.part.closeFeature({ id: sphereId })
```

- `id` — the **feature ID** returned by `part.sphere` (not the part ID)
- Returns feature ID on success, null on failure
- Omitted params keep their existing values (partial update confirmed)
- Supports `@expr.NAME` references and inline math in radius param
- Can add (`references: [wcsId]`) or remove (`references: []`) coordinate system placement
- Can rename the feature via `name` param
- Geometry regenerates on `closeFeature` — no separate `recalc` needed
- Without `openFeature`: returns null with errors 1200 + 1004

## Expression-Driven Radius

Both `@expr.NAME` references and inline math work at creation and update:

```js
// At creation
await api.v1.part.sphere({ id: partId, radius: '@expr.R' })

// At update
await api.v1.part.openFeature({ id: sphereId })
await api.v1.part.updateSphere({ id: sphereId, radius: '@expr.R' })
await api.v1.part.closeFeature({ id: sphereId })
```

When using `@expr.` references, updating the expression + recalc automatically changes the sphere radius.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result

// Optional: create a WCS for positioning
const wcsId = (await api.v1.part.workCSys({
  id: partId, name: 'WCS1',
  origin: [50, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
})).result

// Create sphere at WCS position
const sphereId = (await api.v1.part.sphere({
  id: partId, name: 'Sphere1',
  references: [wcsId],
  radius: 40,
})).result

// Update radius later
await api.v1.part.openFeature({ id: sphereId })
await api.v1.part.updateSphere({ id: sphereId, radius: 80 })
await api.v1.part.closeFeature({ id: sphereId })
```

## Related

- `part.updateSphere` — modify after creation
- `part.openFeature` / `part.closeFeature` — required before/after any update
- `part.workCSys` — create coordinate systems for `references`
- `solid.sphere` — direct (non-parametric) sphere in entity injection
