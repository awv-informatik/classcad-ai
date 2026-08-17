# solid.union

Combines two or more solids into a single solid by boolean union. The target solid is modified in place — tool solids are consumed (deleted) by default.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- At least two solids in the same EIF

## Key Parameters

- `id` — entity injection feature ID (not part ID)
- `target` — solid ID to use as the base. This solid is modified in place and its ID is returned.
- `tools` — array of solid IDs to union into the target. All tools are consumed (deleted) unless `keepTools: true`.
- `keepTools` — boolean, default `false`. When `true`, tool solids remain as separate, valid solids after the union. When `false` (default), tool solid IDs become invalid immediately after the call.

## Return Value

Returns the **target solid ID** (not a new ID). maxLevel=31 on success, messages=[].

## Gotchas

- **Same solid as both target and tool is rejected.** `union({ id, target: X, tools: [X] })` returns `maxLevel 51`, message `"A boolean operation requires distinct target and tool entities (the same id was given for both)."` Previously this hung the server in an infinite loop; it now returns a clean error and the target is preserved. To union a solid with a copy of itself, `solid.copy` it first.
- **Consumed tools are gone.** After a default union (keepTools=false), referencing a tool solid ID in any subsequent call (copy, translate, another union) returns error: `"An element of parameter \"target\" has an invalid id!"` (code 1006, level 51).
- **Non-overlapping bodies succeed silently.** Union of disjoint solids creates a compound solid (multiple disconnected shells under one ID). No error, no warning. This may or may not be what you want.
- **Empty tools array is a no-op.** `tools: []` succeeds silently — returns target ID unchanged, maxLevel=31.

## Usage Hints

- Union returns the target ID — you can chain unions by reusing the same target: `union(target: A, tools: [B])` then `union(target: A, tools: [C])`. The target ID stays stable.
- Use `keepTools: true` when you need tool solids for additional operations (e.g., subtract the same shape elsewhere).
- For overlapping boxes, position them with `translation` so the overlap region is visible in snapshots (offset in both X and Y).
- Multiple tools in one call is more efficient than sequential unions.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"A boolean operation requires distinct target and tool entities..."` (maxLevel 51) | Same solid ID as both target and tool | Use `solid.copy` first if you need to union a solid with a copy of itself. (Previously hung the server; now a clean error.) |
| `"An element of parameter \"target\" has an invalid id!"` (code 1006, level 51) | Referencing a consumed tool solid | Use `keepTools: true`, or stop referencing tool IDs after union |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UnionDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Create two overlapping boxes
const box1 = (await api.v1.solid.box({
  id: eifId, length: 100, width: 60, height: 40
})).result

const box2 = (await api.v1.solid.box({
  id: eifId, length: 60, width: 40, height: 80,
  translation: [60, 30, 0]
})).result

// Union — box2 is consumed into box1
const r = await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })
// r.result === box1 (target ID returned)
// r.maxLevel === 31 (success)
// box2 is now invalid — do not reference it

// Chain another union
const box3 = (await api.v1.solid.box({
  id: eifId, length: 20, width: 40, height: 20,
  translation: [20, 0, 40]
})).result

await api.v1.solid.union({ id: eifId, target: box1, tools: [box3] })
// box1 now contains the union of all three boxes
```

## Related

- `solid.subtraction` — boolean subtract (same target/tools pattern)
- `solid.intersection` — boolean intersect (same target/tools pattern)
- `solid.merge` — NOT a union (different operation, same parameter pattern)
- `solid.copy` — duplicate a solid (use before unioning a solid with a copy of itself)
