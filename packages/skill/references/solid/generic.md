# Common Solid Parameters: rotation, translation, rotateFirst

Every solid creation API (`box`, `sphere`, `cylinder`, `cone`, `extrusion`, `revolve`, `copy`) accepts these optional positioning parameters, identically.

## Parameters

- **`translation`** — `[x, y, z]` world-space offset.
- **`rotation`** — `[rx, ry, rz]` Euler angles in **radians**, applied in **ZYX order**: Z first, then Y, then X (intrinsic ZYX / extrinsic XYZ).
- **`rotateFirst`** — boolean, default `true`. Order when both rotation and translation are given:
  - `true` — rotate, then translate ("orient, then place").
  - `false` — translate, then rotate: the solid **orbits** the origin.

With only one of rotation/translation, `rotateFirst` has no effect (the missing transform is identity).

## Rotation Pivot

Rotation is always around the **world origin** `(0, 0, 0)`, not the solid's center. All `solid.*` primitives (`box`, `cylinder`, `cone`, `sphere`) are origin-centered, so an un-translated primitive spins in place; a translated one orbits the origin. To rotate around a primitive's own center, use `rotateFirst: true` (default). `rotateFirst: false` orbits: box translated to [100,0,0], rotated 90° about Z → COG [0,100,0]. (`part.*` features use different conventions — see `references/part/feature-vs-direct.md`.)

## Gotchas

- **No validation on values.** Any real number is accepted (zero, negative, > 2π) — no warnings, no errors; angles wrap.
- **Zero vectors are silent no-ops** (`rotation: [0,0,0]`, `translation: [0,0,0]`).
- **Rotation order matters.** `[π/2, π/4, 0]` applies Z=0 (no-op), then Y=π/4, then X=π/2 — NOT the same as `[0, π/4, π/2]`.

## Usage Hints

- Positioning only: `translation`. Angled placement: `rotation` + `translation` with default `rotateFirst: true`.
- Circular/radial patterns around the origin: `rotateFirst: false` — translate to the radius, rotate to distribute copies.
- Radians: 90° = `Math.PI / 2`, 45° = `Math.PI / 4`, 180° = `Math.PI`.

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Positioning' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Rotated 45° about Z in place, then moved
const box1 = (await api.v1.solid.box({
  id: eifId, length: 50, width: 30, height: 20,
  rotation: [0, 0, Math.PI / 4], translation: [100, 0, 40],
})).result

// rotateFirst=false — placed at [100,0,0], then orbits 90° about Z → ends at [0,100,0]
const box2 = (await api.v1.solid.box({
  id: eifId, length: 50, width: 30, height: 20,
  rotation: [0, 0, Math.PI / 2], translation: [100, 0, 0], rotateFirst: false,
})).result
```

## Related

`solid.translation` · `solid.rotation` · `solid.copy` · `common.transformObjectWithMatrix`
