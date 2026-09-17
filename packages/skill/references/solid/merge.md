# solid.merge

Combines solids into one compound solid by **concatenating their geometry** — no boolean computation. Overlaps are NOT resolved: all original faces are kept, including internal/double walls. Think "group these bodies under one solid ID", not "fuse into one watertight shape". Shared rules (keepTools, empty tools, cross-EIF, destroyed targets): `solid/target-tools-pattern`.

## Key Parameters

- `id` — entity injection feature ID (not part ID). Tools can come from a different EIF.
- `target` — base solid, modified in place; its ID is returned.
- `tools` — solid IDs to merge in (several allowed, e.g. `[box2, box3, cylinder]`); consumed unless `keepTools: true`.
- `keepTools` — default `false`.

## Return Value

The **target solid ID** (not a new ID), maxLevel=31, messages=[].

## Merge vs Union

| | Merge | Union |
|---|---|---|
| **Computation** | Concatenates shells | Computes boolean intersection |
| **Overlapping faces** | Preserved (double walls) | Resolved (faces split at intersection) |
| **Vertex/edge count** | Sum of inputs | More (split faces) |
| **Watertight** | No (if bodies overlap) | Yes |
| **Speed** | Faster (no kernel computation) | Slower |
| **Use case** | Grouping bodies, pre-boolean assembly (merge then boolean/copy) | Clean fused geometry |

## Gotchas

- **Overlapping geometry is NOT resolved** — double walls can break downstream operations expecting watertight geometry.
- **Same solid as target and tool is rejected**: maxLevel 51, `"A merge operation requires distinct target and tool entities (the same id was given for both)."`, target preserved (previously hung the server). Use `solid.copy` first to merge a solid with a copy of itself.
- **No `updateMerge`** — one-shot operation.
- Merged solids work in booleans and `solid.copy` (compound structure preserved); chaining keeps the target ID stable; `tools: []` is a silent no-op.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"A merge operation requires distinct target and tool entities..."` (maxLevel 51) | Same ID as target and tool | `solid.copy` first |
| `"An element of parameter \"target\" has an invalid id!"` (code 1006, level 51) | Referencing a consumed tool | `keepTools: true`, or stop using tool IDs after merge |

## Working Example

```js
const partId = (await api.v1.part.create({})).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const box1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result
const box2 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 80, translation: [60, 30, 0] })).result

const r = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2] })
// r.result === box1, maxLevel 31; box2 consumed

// Merged solid in a boolean — cuts through both merged shells
const cyl = (await api.v1.solid.cylinder({ id: eifId, diameter: 30, height: 100, translation: [50, 30, -10] })).result
await api.v1.solid.subtraction({ id: eifId, target: box1, tools: [cyl] })
```

## Related

`solid/target-tools-pattern` · `solid.union` · `solid.subtraction` · `solid.intersection` · `solid.copy`
