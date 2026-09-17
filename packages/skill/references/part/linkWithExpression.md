# part.linkWithExpression

Connects a named expression to a feature parameter **after** creation. For sketch dimensions, use `sketch.updateDimension({ id: dimensionId, value: '@expr.NAME' })` instead; obtain the `CC_*FeatureDimension` ID as described in [dimension](../sketch/dimension.md#return-value).

## Key Parameters

- `id` — **feature ID**, not the part ID. The type gate also accepts dimension IDs, but use `sketch.updateDimension` for sketch bindings. Internal constraint IDs are rejected.
- `exprName` — expression name (must exist in the part's expression set)
- `name` — feature parameter to bind (e.g. `'height'`, `'length'`, `'diameter'`)

## Return Value

Always `result: null` (VOID). Check `maxLevel`:
- `31` — success (or silent no-op for a bad param name)
- `51` — error (missing params, wrong ID type, non-existent expression)

## Gotchas

- **No validation on param name.** Linking to a non-existent parameter (`'fakeParam'`) returns maxLevel=31 with NO error and does nothing. Double-check parameter names.
- **Non-existent expression name** → maxLevel=51 with "Datamember X not found", still VOID (no distinct error shape).
- **Geometry updates immediately** after linking — no `common.recalc()` needed.
- **Re-linking** an already-bound parameter (via `@expr.NAME` at creation or a prior link) works directly — no unlink needed (link height to A, then to B: both succeed).
- **Multiple params** of one feature can link to different or the same expressions (`L`→length, `W`→width, `S`→height; or `S` driving both length and height).

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| "wrong id type! Provide only following id types: ['feature','dimension']" | 1001 | Passed part ID instead of feature/dimension ID |
| "exprName must be provided" | 1004 | Missing `exprName` |
| "name must be provided" | 1004 | Missing `name` |
| "id must be provided" | 1004 | Missing `id` |
| "Datamember X not found" | 0 | Expression name doesn't exist |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'H', value: 120 },
    { name: 'D', value: 80 },
  ],
})

const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

// Bind height to H → box height 120
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
// Re-link to D without unlinking → box height 80
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'D', name: 'height' })

// Update D → box height 200
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'D', value: 200 }] })
```

## Related

`part.unlinkExpression` · `part.expression` · `@expr.NAME`
