# solid.cylinder

Creates a cylinder primitive in an entity injection feature (EIF).

## Key Parameters

- `id` — EIF ID, **not** the part ID (wrong type → `"Provide only following id types: [\"entityinjection\"]"`)
- `height` — total Z-dimension (required); **z-centered**, spans `z=-height/2..+height/2`
- `diameter` — full diameter (required). Diameter, **not radius**: `diameter: 50` → radius 25.
- `rotation`, `translation`, `rotateFirst` (default `true`) — optional; see `solid/generic`

Required params validated in order id → height → diameter; only the first missing one is reported.

## Return Value

Integer solid ID (e.g. `61`), maxLevel=31, messages=[]. On error `null`, maxLevel=51 with descriptive messages.

## Alignment

**Fully centered at the origin**: cross-section centered at (0, 0), z-centered. `height=100` → COG (0, 0, 0), not (0, 0, 50). (Older docs claiming z=`0..h` were wrong.) All `solid.*` primitives share this; **`part.cylinder` differs** — base-anchored, z=`0..H` (see `references/part/feature-vs-direct.md`).

Practical: a through-hole piercing a plate at z∈[-t/2,+t/2] needs `height >= t` and `translation: [..., 0]` — no z-offset.

## Gotchas

- **Zero dimensions accepted silently** (maxLevel=31): `height: 0` → degenerate flat disk, `diameter: 0` → degenerate line/point.
- **Negative dimensions accepted silently** (maxLevel=31): internal geometry the renderer cannot display. **Always validate dimensions > 0.**

## Common Errors

| Error (level 51) | Cause |
|---|---|
| `"The parameter \"height\" must be provided"` | Missing height |
| `"The parameter \"diameter\" must be provided"` | Missing diameter |
| `"The parameter \"id\" has a wrong id type!"` | Part ID instead of EIF ID — use `part.entityInjection` ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Centered at origin, axis along Z
const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 100, diameter: 50 })).result

// 90° about X — lies along Y; then translated
const cyl2Id = (await api.v1.solid.cylinder({
  id: eifId, height: 80, diameter: 30,
  translation: [80, 0, 0], rotation: [Math.PI / 2, 0, 0],
})).result
```

## Related

`solid/generic` · `solid.box` · `solid.sphere` · `solid.cone` · `solid.deleteSolid` · `solid.copy` · `solid.translation` / `solid.rotation` / `solid.scale` · `solid.union` / `solid.subtraction` / `solid.intersection`
