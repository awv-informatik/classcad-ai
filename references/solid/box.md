# solid.box

Creates a box primitive solid within an entity injection feature.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`) — pass the EIF ID as `id`, **not** the part ID

## Key Parameters

- `id` — entity injection feature ID (not part ID). Error message is clear if wrong type: `"Provide only following id types: [\"entityinjection\"]"`
- `length` — X-dimension (required)
- `width` — Y-dimension (required)
- `height` — Z-dimension (required)
- `translation` — `[x, y, z]` offset from origin (optional)
- `rotation` — `[rx, ry, rz]` rotation in **radians** around each axis (optional)
- `rotateFirst` — boolean, default `true`. Controls transform order when both rotation and translation are provided:
  - `true` (default): rotate around origin first, then translate
  - `false`: translate first, then rotate around origin — the box ends up orbiting the origin

## Return Value

Returns an **integer solid ID** on success (e.g., `61`). maxLevel=31 on success, messages=[].

On error, returns `null` with maxLevel=51 and descriptive error messages.

## Alignment

The box is **corner-aligned at the origin** — it extends from (0,0,0) in the positive X (length), Y (width), and Z (height) directions. It is NOT centered.

## Gotchas

- **Zero dimensions are accepted silently.** `length: 0` creates a degenerate flat plane (the remaining width × height rectangle). No error, no warning, maxLevel=31. The geometry renders as a 2D surface.
- **Negative dimensions are accepted silently.** They create internal geometry that the renderer cannot display. No error, no warning, maxLevel=31. The STEP/OFB files are still produced but contain degenerate data. **Always validate dimensions > 0 before calling.**
- **Required params are validated in order:** length → width → height. If multiple are missing, only the first missing one is reported.
- **rotateFirst with translation-only** — rotation defaults to `[0,0,0]`, so `rotateFirst` has no visible effect when only translation is provided (and vice versa).

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"The parameter \"height\" must be provided"` (code 1004, level 51) | Missing required dimension | Add the missing parameter |
| `"The parameter \"id\" has a wrong id type!"` (code 1001, level 51) | Passed part ID instead of EIF ID | Use the ID from `part.entityInjection`, not `part.create` |

## Usage Hints

- Multiple boxes can coexist in one entity injection feature — each gets its own solid ID
- Use `solid.deleteSolid({ id: eifId, ids: [boxId] })` to remove specific boxes. Omit `ids` to clear all solids.
- `deleteSolid` returns VOID (null) on success, maxLevel=31
- For boolean operations (union, subtraction, intersection), create multiple solids in the same EIF first, then combine them

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'MyPart' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Basic box at origin
const boxId = (await api.v1.solid.box({
  id: eifId,
  length: 100,
  width: 60,
  height: 40
})).result

// Translated + rotated box
const box2Id = (await api.v1.solid.box({
  id: eifId,
  length: 50,
  width: 50,
  height: 50,
  translation: [120, 0, 0],
  rotation: [0, 0, Math.PI / 4]  // 45° around Z
})).result
```

## Related

- `solid.deleteSolid` — remove solids from an EIF
- `solid.copy` — duplicate a solid with optional transform
- `solid.translation` / `solid.rotation` / `solid.scale` — transform existing solids
- `solid.union` / `solid.subtraction` / `solid.intersection` — boolean operations between solids
- `part.entityInjection` — create the required EIF container
