# sketch.copyGeometry

Copies sketch geometry elements within the same sketch, offset by a translation vector.

## Prerequisites

- A part (`part.create`)
- A sketch (`sketch.create` or `part.sketch`)
- At least one geometry element in the sketch to copy

## Key Parameters

- **`id`** (required) — sketch ID
- **`geomIds`** (required) — array of geometry IDs to copy. Accepts lines, circles, arcs, points, and mixed types. One output ID per input element.
- **`translation`** (required) — `[x, y, z]` offset vector. **This is not optional** — omitting it produces error 1004. `[0, 0, 0]` is valid (copies on top of original).
- **`doCopyConstraints`** (optional, default TRUE) — whether to copy constraints from the original elements.

## Return Value

**Critical gotcha:** The return value depends entirely on `doCopyConstraints`:

- `doCopyConstraints: true` (or omitted/default) → **result is always `null`**. The copy succeeds (geometry appears), but no IDs are returned. The docs claim `id[]|VOID` but the actual behavior is null.
- `doCopyConstraints: false` → **result is `id[]`** — an array of new geometry IDs, one per input element in matching order.

**If you need the IDs of copied elements, you must pass `doCopyConstraints: false`.** This is the only way.

## Gotchas

- `translation` is required despite no `[param.translation]` bracket marking in the source docs. Omitting it → error 1004.
- Empty `geomIds: []` is a silent no-op — null result, maxLevel 31, no messages, no error.
- Invalid IDs in geomIds → error 1006: "An element of parameter \"geomIds\" has an invalid id!"
- Null values in geomIds → error 1001: type mismatch. Always filter nulls before passing.
- The `doCopyConstraints` flag controls the return type, not just constraint behavior. This is undocumented.

## Common Errors

| Code | Message | Cause |
|------|---------|-------|
| 1004 | "The parameter \"translation\" must be provided" | Missing `translation` param |
| 1006 | "An element of parameter \"geomIds\" has an invalid id!" | Non-existent ID in geomIds |
| 1001 | "An element of parameter \"geomIds\" has the wrong type!" | Null or non-id value in geomIds |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const skId = (await api.v1.sketch.create({ id: partId })).result

const line = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 0, 0] })).result

// To get back the IDs of copied elements, use doCopyConstraints: false
const r = await api.v1.sketch.copyGeometry({
  id: skId,
  geomIds: [line],
  translation: [0, 30, 0],
  doCopyConstraints: false
})
// r.result → [67] — array of new IDs, one per input element
```

```js
// Copy rectangle (4 lines) — constraints are copied by default but result is null
const rectLines = (await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
const r2 = await api.v1.sketch.copyGeometry({
  id: skId,
  geomIds: rectLines,
  translation: [60, 0, 0]
})
// r2.result → null (geometry copied but no IDs returned when doCopyConstraints is default/true)
```

## Related

- `sketch.copyFrom` — copies geometry between different sketches
- `sketch.moveGeometry` — moves instead of copying
- `sketch.linearPattern` / `sketch.circularPattern` / `sketch.mirrorPattern` — patterned copies
