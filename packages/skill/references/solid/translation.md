# solid.translation

Translates a solid by a given vector in the part's coordinate system. The solid is modified in place — no new solid is created.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- A solid in that EIF

## Key Parameters

- `id` — entity injection feature ID (not part ID). Error code 1001 if you pass a part ID.
- `target` — solid ID to translate. Must be a valid, non-consumed solid. Error code 1001 if wrong type, 1006 if invalid/consumed.
- `translation` — `[x, y, z]` vector. Coordinates are in the part's local coordinate system. Required — code 1004 if omitted.

## Return Value

Returns the **target solid ID** (same ID, not a new one). maxLevel=31 on success, messages=[].

## Behavior

- **Cumulative.** Each `translation` call adds to the solid's current position. Two calls of `[50, 0, 0]` then `[0, 50, 0]` result in the solid at `[+50, +50, 0]` from its original position. This is not absolute positioning.
- **Zero vector is a no-op.** `[0, 0, 0]` succeeds silently — returns solid ID, maxLevel=31, no error.
- **Negative values work.** `[-30, -30, -30]` moves the solid in the negative direction as expected.
- **No upper bound.** `[10000, 0, 0]` works without error. Fractional values like `[0.001, 0.5, -0.123]` also work.
- **Works on compound solids.** After a boolean union, translating the target solid moves the entire compound shape.
- **No `updateTranslation` method exists.** To undo or modify, apply another translation with the inverse vector.

## Gotchas

- **`id` is the EIF ID, not the part ID.** Passing the part ID gives: `"The parameter \"id\" has a wrong id type! Provide only following id types: [\"entityinjection\"]"` (code 1001).
- **Consumed tool solids are invalid.** After a boolean with `keepTools: false` (default), the tool solid ID is dead. Translating it gives code 1006: `"An element of parameter \"target\" has an invalid id!"`.
- **Auto-scaling hides single-body translations in snapshots.** If you're verifying visually, include a fixed reference body — otherwise before/after snapshots look identical.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` | 1001 | Passed part ID instead of EIF ID | Use the entity injection feature ID |
| `"The parameter \"target\" has a wrong id type!"` | 1001 | Passed non-solid ID as target | Use a solid ID |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Invalid or consumed solid ID | Check the solid wasn't consumed by a boolean |
| `"The parameter \"translation\" must be provided!"` | 1004 | Missing translation param | Always provide `[x, y, z]` vector |
| `"The parameter \"target\" must be provided!"` | 1004 | Missing target param | Always provide the solid ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result

// Translate 80 units along X
const r = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [80, 0, 0] })
// r.result === boxId (same ID returned)
// r.maxLevel === 31
```

## Related

- `solid.rotation` — rotate a solid by Euler angles
- `solid.scale` — scale a solid by a factor
- `solid.mirror` — mirror a solid across a plane
- `solid.copy` — copy a solid (supports translation + rotation params at creation time)
