# solid.translation

Moves a solid in place by a vector in the part's coordinate system.

## Key Parameters

- `id` — entity injection feature ID. Part ID → code 1001 `"The parameter \"id\" has a wrong id type! Provide only following id types: [\"entityinjection\"]"`.
- `target` — solid ID; wrong type → 1001; invalid or consumed (a tool after a `keepTools: false` boolean) → 1006 `"An element of parameter \"target\" has an invalid id!"`.
- `translation` — `[x, y, z]` in part-local coordinates. Required — code 1004 if omitted.

## Return Value

The **target solid ID** (same ID), maxLevel=31, messages=[].

## Behavior

- **Relative, cumulative** — not absolute positioning: `[50, 0, 0]` then `[0, 50, 0]` → `[+50, +50, 0]` from the start. No `updateTranslation`; undo with the inverse vector.
- `[0, 0, 0]` is a silent no-op (maxLevel=31). Negative, fractional (`[0.001, 0.5, -0.123]`) and large (`[10000, 0, 0]`) values work.
- **Compound solids:** after a union, translating the target moves the whole compound.
- **Auto-scaling hides single-body translations in snapshots** — include a fixed reference body, or before/after look identical.
- **Never translate a destroyed boolean target** — it crashes the worker (see `solid/target-tools-pattern`).

## Common Errors

| Error | Code | Cause |
|---|---|---|
| `"The parameter \"id\" has a wrong id type!"` | 1001 | Part ID instead of EIF ID |
| `"The parameter \"target\" has a wrong id type!"` | 1001 | Non-solid ID as target |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Invalid or consumed solid ID |
| `"The parameter \"translation\" must be provided!"` | 1004 | Missing translation |
| `"The parameter \"target\" must be provided!"` | 1004 | Missing target |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 50, height: 50 })).result

// 80 along X — r.result === boxId, maxLevel 31
const r = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [80, 0, 0] })
```

## Related

`solid.rotation` · `solid.scale` · `solid.mirror` · `solid.copy`
