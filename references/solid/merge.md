# solid.merge

Combines multiple solids into a single compound solid by **concatenating their geometry** — no boolean computation. Unlike `union`, merge does NOT resolve overlapping regions. All original faces from every input body are preserved as-is, including internal/double walls where bodies overlap.

Think of merge as "group these bodies under one solid ID" rather than "fuse them into one watertight shape."

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- At least one target solid and one or more tool solids

## Key Parameters

- `id` — entity injection feature ID (not part ID). Tools can come from a different EIF.
- `target` — solid ID to use as the base. Modified in place; its ID is returned.
- `tools` — array of solid IDs to merge into the target. Consumed by default.
- `keepTools` — boolean, default `false`. When `true`, tool solid IDs remain valid after merge. When `false`, tool IDs become invalid immediately.

## Return Value

Returns the **target solid ID** (not a new ID). maxLevel=31 on success, messages=[].

## Merge vs Union — When to Use Which

| | Merge | Union |
|---|---|---|
| **Computation** | Concatenates shells | Computes boolean intersection |
| **Overlapping faces** | Preserved (double walls) | Resolved (faces split at intersection) |
| **Vertex/edge count** | Sum of inputs | More (split faces) |
| **Watertight** | No (if bodies overlap) | Yes |
| **Speed** | Faster (no kernel computation) | Slower |
| **Use case** | Grouping bodies, pre-boolean assembly | Clean fused geometry |

**Use merge when** you need to group bodies under one ID for subsequent operations (e.g., merge then boolean, merge then copy). **Use union when** you need clean, watertight geometry with resolved intersections.

## Gotchas

- **Same solid as both target and tool is rejected.** `merge({ id, target: X, tools: [X] })` returns `maxLevel 51`, message `"A merge operation requires distinct target and tool entities (the same id was given for both)."` Previously this hung the server in an infinite loop; it now returns a clean error and the target is preserved.
- **No `updateMerge` exists.** Merge is a one-shot operation with no update method.
- **Overlapping geometry is NOT resolved.** If two boxes overlap, the overlapping region has double walls. This can cause issues with downstream operations that expect watertight geometry.
- **keepTools works the same as booleans.** With `keepTools: false` (default), tool solid IDs become invalid after merge. With `keepTools: true`, tool IDs remain valid and usable.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"A merge operation requires distinct target and tool entities..."` (maxLevel 51) | Same solid ID as both target and tool | Use `solid.copy` first if you need to merge a solid with a copy of itself. (Previously hung the server; now a clean error.) |
| `"An element of parameter \"target\" has an invalid id!"` (code 1006, level 51) | Referencing a consumed tool solid | Use `keepTools: true`, or stop referencing tool IDs after merge |

## Usage Hints

- **Merged solids can participate in boolean operations.** Merge two boxes, then subtract a cylinder — works fine.
- **Cross-EIF merge is supported.** Target and tools can be from different entity injection features.
- **Chaining works.** The target ID stays stable: `merge(target: A, tools: [B])` then `merge(target: A, tools: [C])`.
- **Merged solids can be copied.** `solid.copy({ id: eifId, target: mergedSolidId })` preserves the compound structure.
- **Empty tools array is a no-op.** `tools: []` succeeds silently — returns target ID unchanged.
- **Multiple tools in one call** is supported: `tools: [box2, box3, cylinder]`.

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Create two overlapping boxes
const box1 = (await api.v1.solid.box({
  id: eifId, length: 100, width: 60, height: 40
})).result

const box2 = (await api.v1.solid.box({
  id: eifId, length: 60, width: 40, height: 80,
  translation: [60, 30, 0]
})).result

// Merge — box2's geometry is concatenated into box1
const r = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2] })
// r.result === box1 (target ID returned)
// r.maxLevel === 31 (success)
// box2 is now invalid (consumed) — do not reference it

// The merged solid can be used in boolean operations
const cyl = (await api.v1.solid.cylinder({
  id: eifId, diameter: 30, height: 100, translation: [50, 30, -10]
})).result

await api.v1.solid.subtraction({ id: eifId, target: box1, tools: [cyl] })
// box1 now has the cylinder cut through both merged shells
```

## Related

- `solid.union` — boolean union (resolves overlaps, produces watertight geometry)
- `solid.subtraction` — boolean subtract (same target/tools pattern)
- `solid.intersection` — boolean intersect (same target/tools pattern)
- `solid.copy` — duplicate a solid (use before merging a solid with a copy of itself)
