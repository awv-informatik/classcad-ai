# part.getFeature

Looks up a feature by name inside a part and returns its ID.

## Key Parameters

- **`id`** (required) — part ID. Any other ID type gives error 1001.
- **`name`** (required) — exact feature name. **Case-sensitive** and **literal** — `"Box"` does not match `"box"` or `"BOX"`; no fuzzy matching.

## Return Value

- **Success:** `{ result: featureId, messages: [], maxLevel: 31 }`
- **Not found:** `{ result: null, messages: [{ code: 0, level: 51, message: 'Feature with name "X" does not exist' }], maxLevel: 51 }` — `null`, not VOID

## Scope

Searches the **OperationSequence**. Finds:

- Solid primitives (Box, Cylinder, Cone, Sphere); profile features (Extrusion, Revolve, Twist); booleans (Union, Subtraction, Intersection); modifications (Chamfer, Fillet, Slice); transformations (Mirror, LinearPattern, CircularPattern, Translation, Rotation)
- Features consumed by a boolean remain findable

Does **NOT** find:

- Sketches — use `part.getSketch`
- Work geometry (planes, axes, points) — use `part.getWorkGeometry`
- Built-in origin features (Origin, Top, Front, Right, XAxis, YAxis, ZAxis) — not reachable

## Auto-Naming

Unnamed features get: 1st `Box`, 2nd `Box0`, 3rd `Box1`, Nth `Type{N-2}` — no space or underscore. The second box is `"Box0"`, not `"Box_1"` or `"Box 1"`.

## Gotchas

- **First-match only.** With duplicate names (e.g. two "Box" via `setObjectName`), returns the first-created; later duplicates are unreachable by name.
- **Rollback is ignored.** Features rolled back via `openFeature` are still findable.
- **Reordering has no effect** — `operationMoveBefore` doesn't affect lookup.
- **Renaming** via `update*({ name })` inside open/close or `common.setObjectName` works — the new name is found and the old name returns null.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 0 | "Feature with name \"X\" does not exist" | No feature with that exact name |
| 1004 | "The parameter \"name\" must be provided" | `name` omitted |
| 1004 | "The parameter \"id\" must be provided" | `id` omitted |
| 1001 | "wrong id type — provide only: [\"part\"]" | `id` is not a part ID |
| 1006 | "invalid id" | Non-existent or zero ID |

`id` is validated before `name`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'MainBox' })).result
await api.v1.part.cylinder({ id: partId, name: 'Pillar' })

const found = (await api.v1.part.getFeature({ id: partId, name: 'MainBox' })).result
// found === boxId

await api.v1.part.openFeature({ id: found })
await api.v1.part.updateBox({ id: found, height: 200 })
await api.v1.part.closeFeature({ id: found })
```

## Related

`part.getSketch` · `part.getWorkGeometry` · `common.setObjectName` · `part.deleteFeature`
