# solid.cone

Creates a cone or frustum primitive in an entity injection feature (EIF), defined by height and bottom/top **diameters**. One diameter 0 → pointed cone; equal diameters → cylinder-like shape.

## Key Parameters

- `id` — EIF ID, **not** the part ID (wrong type → `"Provide only following id types: [\"entityinjection\"]"`)
- `height` — total height along Z (required); spans z=-height/2..+height/2
- `bDiameter` — diameter at the bottom (z=-height/2), required. Diameter, **not radius**.
- `tDiameter` — diameter at the top (z=+height/2), required. Diameter, **not radius**.
- `rotation`, `translation`, `rotateFirst` (default `true`) — optional; see `solid/generic`

## Return Value

Integer solid ID (e.g. `61`), maxLevel=31, messages=[]. On error `null`, maxLevel=51 with descriptive messages.

## Alignment

**Fully centered at the origin** (XY and Z), like all `solid.*` primitives — `solid.cone(h=100)` and `solid.cylinder(h=100)` both span z=-50..+50, so primitives with matching `height` share Z extent without translation. **`part.cone` differs**: base-anchored, z=0..+H (see `references/part/feature-vs-direct.md`).

A frustum's COG is **not** at z=0 — mass biases toward the larger end. `bDiameter=40, tDiameter=10, height=80` → COG z≈-14.3. Correct behavior, not misalignment.

## Gotchas

- **`tDiameter: 0` gives a proper pointed cone** (docs examples use `0.1`, but `0` is valid, no degenerate geometry). **`bDiameter: 0`** gives an inverted one — diameters are fully symmetric; either may be larger.
- **Zero dimensions accepted silently** (maxLevel=31): `height: 0` → degenerate flat geometry. **Negative dimensions accepted silently** (maxLevel=31): internal geometry, same as box/cylinder. **Always validate dimensions > 0.**
- **Validation order differs:** missing params reported as `bDiameter → height → tDiameter` (cylinder: `height → diameter`; box: `length → width → height`).

## Common Errors

| Error (level 51) | Cause |
|---|---|
| `"The parameter \"bDiameter\" must be provided"` | Missing bDiameter |
| `"The parameter \"height\" must be provided"` | Missing height |
| `"The parameter \"tDiameter\" must be provided"` | Missing tDiameter |
| `"The parameter \"id\" has a wrong id type!"` | Part ID instead of EIF ID — use `part.entityInjection` ID |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Frustum
const frustumId = (await api.v1.solid.cone({ id: eifId, height: 100, bDiameter: 60, tDiameter: 20 })).result

// True pointed cone, translated
const pointedId = (await api.v1.solid.cone({
  id: eifId, height: 80, bDiameter: 40, tDiameter: 0, translation: [100, 0, 0],
})).result
```

## Related

`solid/generic` · `solid.cylinder` · `solid.box` · `solid.sphere` · `solid.deleteSolid` · `solid.copy` · `solid.translation` / `solid.rotation` / `solid.scale` · `solid.union` / `solid.subtraction` / `solid.intersection`
