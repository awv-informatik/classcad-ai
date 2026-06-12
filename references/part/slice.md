# part.slice

Creates a slice feature that cuts solids at a work plane, keeping one side and discarding the other.

## Prerequisites

- A part (`part.create`)
- At least one solid feature (e.g., `part.box`, `part.cylinder`, etc.)
- A work plane to slice at (built-in like `'Top'` or custom via `part.workPlane`)

## Key Parameters

- `id` — part ID (not feature ID)
- `targets` — features to slice. Accepts plain IDs `[featureId]` or objects `[{ id: featureId, indices: [0] }]`. All target features are **consumed** after the operation.
- `reference` — work plane ID to slice at. **Required** despite being marked optional in the API docs. Omitting it gives error code 1004.
- `inverted` — which side to keep. `0` (FALSE, default): keep the side along the plane's normal vector (+normal). `1` (TRUE): keep the opposite side (-normal).
- `name` — optional, defaults to `"Slice"`.

## Return Value

Returns a **new feature ID** — not the target ID. This is the same pattern as `part.boolean`. The original target feature IDs become invalid after the slice.

## Consumption Behavior

**Target features are consumed.** After `part.slice`, the original feature IDs are invalid. Reusing them gives error code 1014: `"Entity \"...\" is not available. It has already been consumed/used in another operation."`

The returned slice feature ID is valid for subsequent operations (boolean, another slice, etc.):

```js
const sliceId = (await api.v1.part.slice({ id: partId, targets: [boxId], reference: wpId })).result
// boxId is now consumed — do NOT reference it
const subId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: sliceId, tools: [cylId] })).result
```

## Gotchas

- **`reference` is required.** The docs mark it as optional with `(default=xy)`, but omitting it always errors: `"The parameter \"reference\" must be provided in the api call!"` (code 1004). Always pass a work plane ID.
- **Plane missing the solid is a silent no-op.** If the plane doesn't intersect any target, the slice succeeds (maxLevel 31) and the solid is preserved on whichever side of the plane it falls. No error, no warning.
- **Multiple `part.create` calls in one session** clear the drawing. Build one slice scenario per cleared drawing.
- **Angled planes work.** The work plane normal doesn't need to be axis-aligned — diagonal cuts are supported.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The parameter \"reference\" must be provided in the api call!"` | 1004 | Missing or null reference | Always provide a work plane ID |
| `"Set the parameter \"reference\" = VOID is not allowed in this situation!"` | 1001 | `getWorkGeometry` returned null (wrong name) | Use correct plane name (e.g., `'Top'` not `'WorkPlane_Top'`) |
| `"Entity \"...\" is not available. It has already been consumed/used in another operation."` | 1014 | Reusing a consumed target feature ID | Use the returned slice feature ID instead |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SliceDemo' })).result

const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 50, height: 60 })).result

// Create a work plane at z=20
const wpId = (await api.v1.part.workPlane({
  id: partId,
  name: 'CutPlane',
  origin: [0, 0, 20],
  normal: [0, 0, 1],
  xDirection: [1, 0, 0],
})).result

// Slice: keep +Z side (z=20 to z=60)
const sliceId = (await api.v1.part.slice({
  id: partId,
  targets: [{ id: boxId }],
  reference: wpId,
})).result
// boxId is now consumed — use sliceId for subsequent operations

// To keep the -Z side instead, use inverted: 1
// const sliceId = (await api.v1.part.slice({
//   id: partId,
//   targets: [{ id: boxId }],
//   reference: wpId,
//   inverted: 1,
// })).result
```

## Multiple Targets

```js
const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 50, width: 30, height: 40 })).result
const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 30, width: 50, height: 60, translation: [60, 0, 0] })).result

const sliceId = (await api.v1.part.slice({
  id: partId,
  targets: [{ id: box1 }, { id: box2 }],
  reference: wpId,
})).result
// Both box1 and box2 are consumed
```

## Related

- `part.updateSlice` — modify reference, inverted, name after creation (requires `openFeature`/`closeFeature`)
- `part.sliceBySheet` — slice using a sheet body instead of a work plane
- `part.boolean` — similar consumption pattern, different operation
- `part.workPlane` — create the reference plane this consumes
