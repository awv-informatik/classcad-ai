# solid.copy

Duplicates an existing solid into an entity injection feature (EIF), with optional positioning.

## Key Parameters

- **`id`** — destination EIF ID. Need NOT be the EIF containing `target` — cross-EIF copy (same part) is supported.
- **`target`** — solid ID to duplicate. Must be a solid (not EIF, part, or curve); any solid type works (primitives, extrusions, revolves, boolean results).
- **`rotation`**, **`translation`**, **`rotateFirst`** (default `true`) — see `solid/generic`. Rotation is around the **world origin**; `rotateFirst: false` gives an orbital pattern, ideal for distributing copies in a circle.

## Return Value

The new solid's ID; each copy gets a unique, incrementing ID. `null` with maxLevel=51 on error.

## Behavior

- **No transform** → copy exactly overlaps the original (renderer shows different colors; geometrically indistinguishable until one moves). Both IDs are independently valid.
- **Fully independent.** Modifying the original (boolean subtraction, translation, …) does NOT affect the copy; they share no state.
- **Preserves topology** — boolean holes, complex profiles, all B-rep features; vertex and edge counts match exactly.
- **First-class solid** — usable as boolean tool, in transforms, for further copies. The same source can be copied repeatedly.
- No `updateCopy` / `deleteCopy`: remove with `solid.deleteSolid`, reposition with `solid.translation` / `solid.rotation`.

## Common Errors

| Error code | Message | Cause |
|---|---|---|
| 1006 | `An element of parameter "target" has an invalid id!` | Target ID doesn't exist |
| 1006 | `An element of parameter "id" has an invalid id!` | EIF ID doesn't exist |
| 1001 | `The parameter "target" has a wrong id type! Provide only following id types: ["solid"]` | Target is an EIF, part, or other non-solid |

Non-existent ID errors also include a warning (level 41): `"ToId()/TOID() didn't get an existing or valid id."`

## Usage Hints

- **Copy for boolean:** create a tool once, copy it several times, pass all copies as tools in one subtraction/union.
- **Circular pattern:** `rotateFirst: false`, constant `translation` (radius), varying `rotation` angle per copy.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'CopyDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

// Offset copy
const copy1 = (await api.v1.solid.copy({ id: eifId, target: boxId, translation: [80, 0, 0] })).result

// Circular pattern: copies at 90°, 180°, 270° around the origin
for (let i = 1; i <= 3; i++) {
  await api.v1.solid.copy({
    id: eifId, target: boxId,
    rotation: [0, 0, (i * Math.PI) / 2], translation: [80, 0, 0], rotateFirst: false,
  })
}
```

## Related

`solid/generic` · `solid.deleteSolid` · `solid.translation` / `solid.rotation` · `solid.union` / `solid.subtraction`
