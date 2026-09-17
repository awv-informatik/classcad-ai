# solid.box

Creates a box primitive solid in an entity injection feature (EIF).

## Key Parameters

- `id` — EIF ID from `part.entityInjection`, **not** the part ID (wrong type → `"Provide only following id types: [\"entityinjection\"]"`)
- `length` / `width` / `height` — X / Y / Z dimensions (all required; validated in that order, only the first missing one is reported)
- `rotation`, `translation`, `rotateFirst` (default `true`) — optional; see `solid/generic`

## Return Value

Integer solid ID (e.g. `61`), maxLevel=31, messages=[]. On error `null`, maxLevel=51 with descriptive messages.

## Alignment

**Fully centered at the origin**: spans `(-length/2, -width/2, -height/2)` to `(+length/2, +width/2, +height/2)`. E.g. `length=100, width=80, height=60` → corner `(-50, -40, -30)`, COG `(0, 0, 0)`. (Older docs claiming corner alignment were wrong.)

All `solid.*` primitives share this convention. **`part.*` differs**: `part.box` is corner-aligned (`+X+Y+Z`), `part.cylinder`/`part.cone` are base-anchored (z=`0..H`), only `part.sphere` matches. See `references/part/feature-vs-direct.md`.

## Gotchas

- **Zero dimensions accepted silently** (maxLevel=31): `length: 0` gives a degenerate flat width × height surface.
- **Negative dimensions accepted silently** (maxLevel=31): internal geometry the renderer cannot display; STEP/OFB still produced with degenerate data. **Always validate dimensions > 0.**

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"height\" must be provided"` (code 1004, level 51) | Missing required dimension | Add it |
| `"The parameter \"id\" has a wrong id type!"` (code 1001, level 51) | Part ID instead of EIF ID | Use the `part.entityInjection` ID |

## Usage Hints

- Many solids can coexist in one EIF, each with its own ID; create them there, then combine with booleans.
- Remove with `solid.deleteSolid({ id: eifId, ids: [boxId] })` (returns null, maxLevel=31); omit `ids` to clear all solids.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Centered at origin — corners at (±50, ±30, ±20)
const boxId = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result

// Rotated 45° about Z, then translated
const box2Id = (await api.v1.solid.box({
  id: eifId, length: 50, width: 50, height: 50,
  translation: [120, 0, 0], rotation: [0, 0, Math.PI / 4],
})).result
```

## Related

`solid/generic` · `solid.deleteSolid` · `solid.copy` · `solid.translation` / `solid.rotation` / `solid.scale` · `solid.union` / `solid.subtraction` / `solid.intersection` · `part.entityInjection`
