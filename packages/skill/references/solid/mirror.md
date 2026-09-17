# solid.mirror

Mirrors a solid in place across a plane given by a point and a normal. No new solid is created.

## Key Parameters (all required, code 1004 if omitted)

- `id` — entity injection feature ID (part ID → code 1001)
- `target` — solid ID; wrong type → 1001, invalid/consumed (e.g. a tool after a default boolean) → 1006
- `originPos` — `[x, y, z]` point on the plane. Pins WHERE the plane sits: `[0,0,0]` vs `[50,0,0]` with the same normal give completely different results.
- `normal` — `[x, y, z]` plane normal. Auto-normalized (`[5,0,0]` ≡ `[1,0,0]`); sign irrelevant (`[1,0,0]` ≡ `[-1,0,0]`). Zero vector → kernel error `"Invalid mirror normal!"` (code 0, level 51).

## Return Value

The **target solid ID** (same ID), maxLevel=31, messages=[].

## Behavior

- **Double mirror = identity** — two mirrors across the same plane restore the original exactly. No `updateMirror`; to undo, mirror again.
- **Normals handled correctly** — unlike `solid.scale` with a negative factor (inside-out geometry), no rendering artifacts or broken booleans.
- Works on all solid types (box, sphere, cylinder, cone, post-boolean compounds); chains cumulatively with `solid.translation` / `rotation` / `scale`.
- **Auto-scaling hides single-body mirrors in snapshots** — include a fixed reference body when verifying visually.

## Common Mirror Planes

| Plane | originPos | normal | Effect |
|---|---|---|---|
| YZ (reflect X) | `[0,0,0]` | `[1,0,0]` | Negates X |
| XZ (reflect Y) | `[0,0,0]` | `[0,1,0]` | Negates Y |
| XY (reflect Z) | `[0,0,0]` | `[0,0,1]` | Negates Z |
| Offset YZ at X=50 | `[50,0,0]` | `[1,0,0]` | Reflects around X=50 |
| 45° diagonal | `[0,0,0]` | `[1,1,0]` | Swaps X↔Y (with negation) |

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` | 1001 | Part ID instead of EIF ID |
| `"The parameter \"target\" has a wrong id type!"` | 1001 | Non-solid ID as target |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Invalid or consumed solid ID |
| `"The parameter \"<id\|target\|originPos\|normal>\" must be provided!"` | 1004 | Missing parameter |
| `"Invalid mirror normal!"` | 0 | Zero normal `[0,0,0]` |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 30, translation: [20, 10, 0] })).result

// Across YZ plane (negate X) — r.result === boxId, maxLevel 31
const r = await api.v1.solid.mirror({ id: eifId, target: boxId, originPos: [0, 0, 0], normal: [1, 0, 0] })

// Across offset plane at X=50
await api.v1.solid.mirror({ id: eifId, target: boxId, originPos: [50, 0, 0], normal: [1, 0, 0] })
```

## Related

`solid.translation` · `solid.rotation` · `solid.scale` · `solid.copy`
