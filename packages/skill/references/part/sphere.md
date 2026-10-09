# part.sphere

Parametric sphere feature in a part's feature tree (unlike `solid.sphere`, direct geometry in an entity injection). Supports `updateSphere`, expression-driven radius, and workCSys placement via `references`.

## Key Parameters

- `id` — **part ID** (not entity injection ID — that's `solid.sphere`)
- `name` — feature name (default: "Sphere")
- `radius` — default 100, > 0. Numbers or expression strings (`'@expr.R'`, `'sqrt(900)'`, `'@expr.R * @expr.factor'`), at creation and update. With `@expr.` references, `part.updateExpression` updates the sphere at once (no recalc).
- `references` — array of **workCSys IDs only**; sphere center at the csys origin. Empty/omitted = drawing origin

## Return Value

Feature ID (numeric), maxLevel 31. Pass it to `updateSphere`, `openFeature`, `closeFeature`, etc.

## Alignment

**Centered at the origin**. Measured with `radius=25`: vertex 0 at `(0,0,-25)`, COG `(0,0,0)`. The **only** part primitive matching its `solid.*` sibling — `part.box`, `part.cylinder`, `part.cone` are corner/base-anchored. See `feature-vs-direct.md`.

## Gotchas

- **`references` only accepts `workcsys` IDs.** Work plane/axis/point → error 1001: "The parameter \"references\" has a wrong id type! Provide only following id types: [\"workcsys\"]". Result is null.
- **Zero/negative radius creates a degenerate feature**: feature ID returned with maxLevel 51 and error 1122 ("Value for radius must be greater than 0."); no valid geometry. Validate radius > 0.
- Multiple spheres in one part are fine — each is a separate feature with its own body.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1122 | "Value for radius must be greater than 0" | Zero or negative radius |
| 1001 | "wrong id type! Provide only following id types: ['workcsys']" | Non-workCSys ID in `references` |

## updateSphere

Wrap in `openFeature`/`closeFeature` (without `openFeature`: null + errors 1200 + 1004). `id` = feature ID from `part.sphere`. Returns feature ID on success, null on failure. Omitted params keep values (partial update confirmed); `name` renames; `@expr.`/inline math supported; `references: [wcsId]` adds, `[]` removes placement; geometry regenerates on `closeFeature` (no `recalc` needed).

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const wcsId = (await api.v1.part.workCSys({ id: partId, name: 'WCS1', offset: [50, 0, 0] })).result
await api.v1.part.expression({ id: partId, toCreate: [{ name: 'R', value: 80 }] })

const sphereId = (await api.v1.part.sphere({
  id: partId, name: 'Sphere1', references: [wcsId], radius: 40,
})).result

await api.v1.part.openFeature({ id: sphereId })
await api.v1.part.updateSphere({ id: sphereId, radius: '@expr.R' })
await api.v1.part.closeFeature({ id: sphereId })
```

## Related

`part.updateSphere` · `part.openFeature` / `part.closeFeature` · `part.workCSys` · `solid.sphere`
