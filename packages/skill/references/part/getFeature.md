# part.getFeature

Looks up a feature by name inside a part and returns its ID. This is the primary way to retrieve a feature when you know its name but not its ID.

## Prerequisites

- A part (`part.create`)
- A feature inside that part (box, cylinder, cone, sphere, boolean, extrusion, etc.)

## Key Parameters

- **`id`** (required) — part ID. Must be a part — any other ID type gives error 1001.
- **`name`** (required) — exact feature name. **Case-sensitive** and **literal** — `"Box"` does not match `"box"` or `"BOX"`.

## Return Value

**On success:**
```js
{ result: featureId, messages: [], maxLevel: 31 }
```

**On not found:**
```js
{ result: null, messages: [{ code: 0, level: 51, message: 'Feature with name "X" does not exist' }], maxLevel: 51 }
```

Returns `null` (not VOID) when no match is found.

## Scope — What It Can and Cannot Find

`getFeature` searches the **OperationSequence** (the feature/operation tree). It finds:

- **Solid primitives:** Box, Cylinder, Cone, Sphere
- **Profile-based features:** Extrusion, Revolve, Twist
- **Boolean operations:** Union, Subtraction, Intersection
- **Modification features:** Chamfer, Fillet, Slice
- **Transformation features:** Mirror, LinearPattern, CircularPattern, Translation, Rotation
- **Consumed tools:** Features consumed by a boolean remain findable

It does **NOT** find:

- **Sketches** — use `part.getSketch` instead
- **Work geometry** (planes, axes, points) — use `part.getWorkGeometry` instead
- **Built-in origin features** (Origin, Top, Front, Right, XAxis, YAxis, ZAxis) — not reachable

## Auto-Naming Convention

When creating features without a custom name, the system assigns default names:

| Count | Name |
|-------|------|
| 1st   | `Type` (e.g., "Box") |
| 2nd   | `Type0` (e.g., "Box0") |
| 3rd   | `Type1` (e.g., "Box1") |
| Nth   | `Type{N-2}` |

No space, no underscore — just the type name with a zero-indexed number appended starting from the second instance. If you need to look up the second box, search for `"Box0"`, not `"Box_1"` or `"Box 1"`.

## Gotchas

- **Case-sensitive.** `"Box"` ≠ `"box"`. No fuzzy matching.
- **First-match only.** If duplicate names exist (e.g., two features both named "Box" via `setObjectName`), returns the first-created one. Later duplicates are unreachable by name.
- **Rollback does not hide features.** Even when rolled back via `openFeature`, all features in the tree are findable — `getFeature` ignores rollback bar position.
- **Feature reordering has no effect.** `operationMoveBefore` changes tree order but does not affect name lookup.
- **Use `setObjectName` to rename, not `updateBox({ name })`.** The `name` param on `updateBox` does not update the lookup name. Only `common.setObjectName` changes what `getFeature` sees.
- **After rename, old name stops working.** `setObjectName` is a true rename — the previous name returns null.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 0 | "Feature with name \"X\" does not exist" | No feature with that exact name |
| 1004 | "The parameter \"name\" must be provided" | `name` omitted |
| 1004 | "The parameter \"id\" must be provided" | `id` omitted |
| 1001 | "wrong id type — provide only: [\"part\"]" | `id` is not a part ID |
| 1006 | "invalid id" | Non-existent or zero ID |

Validation order: `id` is validated before `name`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const boxId = (await api.v1.part.box({ id: partId, name: 'MainBox' })).result
const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Pillar' })).result

// Later, look up by name
const found = (await api.v1.part.getFeature({ id: partId, name: 'MainBox' })).result
// found === boxId

// Use the ID for updates
await api.v1.part.openFeature({ id: found })
await api.v1.part.updateBox({ id: found, height: 200 })
await api.v1.part.closeFeature({ id: partId })
```

## Related

- `part.getSketch` — name-based lookup for sketches (getFeature cannot find sketches)
- `part.getWorkGeometry` — name-based lookup for work geometry
- `common.setObjectName` — rename a feature (changes what getFeature finds)
- `part.deleteFeature` — delete a feature by ID (pair with getFeature to delete by name)
