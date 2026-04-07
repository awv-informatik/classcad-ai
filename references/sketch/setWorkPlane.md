# sketch.setWorkPlane

Reassigns a sketch to a different work plane after creation.

## Prerequisites

- An existing sketch (`sketch.create`)
- A work plane (`part.workPlane`)

## Key Parameters

- **`id`** (required) — sketch ID
- **`planeId`** (required) — work plane ID. **Must be a work plane** — face IDs, sketch IDs, and part IDs are rejected with error 1001.

## Return Value

```js
{ result: null (VOID), messages?: [...], maxLevel?: real }
```

Returns VOID on success. maxLevel=31.

## Gotchas

- **Only accepts work plane IDs.** Unlike `sketch.create` which accepts both work planes and faces, `setWorkPlane` only accepts work plane type IDs. Error message: "Provide only following id types: [\"workplane\"]".
- **To move a sketch to a face:** first create a work plane on that face with `part.workPlane`, then pass the work plane ID to `setWorkPlane`.

## Common Errors

| Error | Code | Cause |
|-------|------|-------|
| "invalid id" | 1006 | Non-existent planeId |
| "wrong id type" | 1001 | planeId is not a work plane (e.g., face, sketch, part) |

## Working Example

```js
const skId = (await api.v1.sketch.create({ id: partId })).result
const wpId = (await api.v1.part.workPlane({
  id: partId,
  normal: [0, 1, 0],
  position: [0, 50, 0],
})).result
await api.v1.sketch.setWorkPlane({ id: skId, planeId: wpId })
```

## Related

- `sketch.create` — initial sketch placement (accepts faces too)
- `part.workPlane` — create the target work plane
