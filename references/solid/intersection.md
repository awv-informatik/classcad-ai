# solid.intersection

Computes the boolean intersection of solids — keeps only the volume shared by target and tools. The target is modified in place; tool solids are consumed (deleted) by default.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- At least two solids in the same EIF that overlap

## Key Parameters

- `id` — entity injection feature ID (not part ID)
- `target` — solid ID to use as the base. This solid is modified in place and its ID is returned.
- `tools` — array of solid IDs to intersect with the target. All tools are consumed (deleted) unless `keepTools: true`.
- `keepTools` — boolean, default `false`. When `true`, tool solids remain as separate, valid solids after the intersection. When `false` (default), tool solid IDs become invalid immediately after the call.

## Return Value

- **Success (overlap exists):** Returns the **target solid ID** (not a new ID). maxLevel=31, messages=[].
- **No overlap (disjoint bodies):** Returns `null` (VOID). maxLevel=51, error message: `"Target solid was removed by intersection."` (code 1014). The target is destroyed.
- **Empty tools array:** Returns target ID unchanged (no-op). maxLevel=31.

## Containment Cases

- **Tool fully contains target:** Result = target unchanged (the intersection volume equals the target). No error.
- **Target fully contains tool:** Result = target shrinks to the tool's shape (the intersection volume equals the tool). No error.
- **Partial overlap:** Result = the shared volume only. Both flat and curved surfaces preserved where applicable.

## Gotchas

- **Non-overlapping bodies destroy the target.** Unlike union (which creates a compound solid from disjoint bodies), intersection of disjoint bodies produces nothing — the target is removed. Error code 1014, same as subtraction when tool envelops target. Always verify overlap before calling.
- **Consumed tools are gone.** After a default intersection (keepTools=false), tool solid IDs are invalid. Referencing them in a later call returns a clean `"...has an invalid id!"` error (code 1006, maxLevel 51) — not a hang.
- **`solid.copy` on intersection results may fail.** After intersection (with or without keepTools), calling `solid.copy` on the modified target returned null (maxLevel=51). Use `keepTools: true` and translate/reuse the tool instead if you need duplicates.
- **Multiple tools = n-way intersection.** `tools: [A, B]` produces `target ∩ A ∩ B` — the common volume of all solids. All tools consumed.
- **Empty tools array is a no-op.** `tools: []` succeeds silently — returns target ID unchanged, maxLevel=31.

## Usage Hints

- Intersection returns the target ID — you can chain intersections: `intersection(target: A, tools: [B])` then `intersection(target: A, tools: [C])`. The target ID stays stable.
- Use `keepTools: true` when you need tool solids for additional operations. Kept tools can be translated, used in other booleans, etc.
- Multiple tools in one call is more efficient than sequential intersections and produces the same result.
- Works across solid types — box ∩ cylinder produces a solid with mixed planar/curved faces.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"Target solid was removed by intersection."` | 1014 | Bodies don't overlap, or overlap volume is empty | Verify overlap before calling |
| `"...has an invalid id!"` (code 1006, maxLevel 51) | Operating on a consumed/invalid solid ID | Track valid IDs; the tool is gone after a default intersection |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'IntersectionDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Two overlapping boxes
const box1 = (await api.v1.solid.box({
  id: eifId, length: 100, width: 80, height: 60
})).result

const box2 = (await api.v1.solid.box({
  id: eifId, length: 60, width: 40, height: 80,
  translation: [60, 30, -10]
})).result

// Intersection — keeps only the shared volume
const r = await api.v1.solid.intersection({ id: eifId, target: box1, tools: [box2] })
// r.result === box1 (target ID returned)
// r.maxLevel === 31 (success)
// box2 is now INVALID — do not reference it
// box1 now contains only the overlap region
```

### keepTools example

```js
const tool = (await api.v1.solid.cylinder({
  id: eifId, height: 120, diameter: 60,
  translation: [40, 40, -20]
})).result

// Intersect, keep the tool
await api.v1.solid.intersection({ id: eifId, target: body, tools: [tool], keepTools: true })

// Tool is still valid — move it and reuse
await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 100, 0] })
await api.v1.solid.intersection({ id: eifId, target: body2, tools: [tool] })
```

## Related

- `solid.union` — boolean union (same target/tools/keepTools pattern)
- `solid.subtraction` — boolean subtract (same pattern)
- `solid.merge` — NOT a boolean operation (different semantics)
- `solid.copy` — duplicate a solid (note: may not work on intersection results)
