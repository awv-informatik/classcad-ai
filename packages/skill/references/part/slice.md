# part.slice

Cuts solids at a work plane, keeping one side and discarding the other.

## Key Parameters

- `id` — part ID (not feature ID)
- `targets` — features to slice: `[featureId]` or `[{ id: featureId, indices: [0] }]`. All targets are **consumed**.
- `reference` — work plane ID (built-in like `'Top'` via `getWorkGeometry`, or `part.workPlane`). **Required** despite docs marking it optional `(default=xy)` — omitting gives code 1004.
- `inverted` — `0` (FALSE, default): keep the +normal side. `1` (TRUE): keep the −normal side.
- `name` — default `"Slice"`

## Return Value

A **new feature ID** (like `part.boolean`). Original target IDs become invalid — reusing them gives code 1014 `"Entity \"...\" is not available. It has already been consumed/used in another operation."`. Use the returned ID for subsequent operations (boolean, another slice, …).

## Gotchas

- **Plane missing the solid is a silent no-op** — succeeds (maxLevel 31), solid preserved on whichever side it falls. No error, no warning.
- **One root part per drawing** — a second `part.create` is refused until `common.clear()`.
- **Angled planes work** — the normal needn't be axis-aligned.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The parameter \"reference\" must be provided in the api call!"` | 1004 | Missing or null reference | Always pass a work plane ID |
| `"Set the parameter \"reference\" = VOID is not allowed in this situation!"` | 1001 | `getWorkGeometry` returned null (wrong name) | Use `'Top'`, not `'WorkPlane_Top'` |
| `"Entity \"...\" is not available. It has already been consumed/used in another operation."` | 1014 | Reusing a consumed target | Use the returned slice ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SliceDemo' })).result
const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 50, width: 30, height: 40 })).result
const box2CS = (await api.v1.part.workCSys({ id: partId, name: 'Box2CS', offset: [60, 0, 0] })).result
const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 30, width: 50, height: 60, references: [box2CS] })).result

const wpId = (await api.v1.part.workPlane({ id: partId, name: 'CutPlane', position: [0, 0, 20], normal: [0, 0, 1] })).result

// Keep +Z side (z=20 and up) of both boxes; inverted: 1 would keep the −Z side
const sliceId = (await api.v1.part.slice({
  id: partId,
  targets: [{ id: box1 }, { id: box2 }],
  reference: wpId,
})).result
// box1 and box2 are consumed — use sliceId from here on
```

## Related

`part.updateSlice` · `part.sliceBySheet` · `part.boolean` · `part.workPlane`
