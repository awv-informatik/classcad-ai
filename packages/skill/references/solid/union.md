# solid.union

Combines solids into one by boolean union. Shared rules (keepTools, empty tools, multi-tool, cross-EIF, destroyed targets): `solid/target-tools-pattern`.

## Key Parameters

- `id` — entity injection feature ID (not part ID)
- `target` — base solid, modified in place; its ID is returned
- `tools` — solid IDs to union in; consumed unless `keepTools: true`
- `keepTools` — default `false`

## Return Value

The **target solid ID** (not a new ID), maxLevel=31, messages=[].

## Gotchas

- **Same solid as target and tool is rejected:** maxLevel 51, `"A boolean operation requires distinct target and tool entities (the same id was given for both)."`, target preserved (previously hung the server). `solid.copy` first to union a solid with itself.
- **Consumed tools are gone:** later calls on a tool ID (copy, translate, another union) → `"An element of parameter \"target\" has an invalid id!"` (code 1006, level 51).
- **Non-overlapping bodies succeed silently** — a compound solid (multiple disconnected shells under one ID), no warning. May or may not be what you want.
- `tools: []` is a silent no-op (target ID, maxLevel=31).

## Usage Hints

- Target ID is stable — chain `union(target: A, tools: [B])` then `union(target: A, tools: [C])`; multiple tools in one call is more efficient.
- `keepTools: true` when tools are needed again (e.g. subtract the same shape elsewhere).
- For visible overlap in snapshots, offset overlapping boxes in both X and Y.

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `"A boolean operation requires distinct target and tool entities..."` (maxLevel 51) | Same ID as target and tool | `solid.copy` first |
| `"An element of parameter \"target\" has an invalid id!"` (code 1006, level 51) | Referencing a consumed tool | `keepTools: true`, or stop using tool IDs after union |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'UnionDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const box1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result
const box2 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 80, translation: [60, 30, 0] })).result

const r = await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })
// r.result === box1, maxLevel 31; box2 consumed

// Chain another union
const box3 = (await api.v1.solid.box({ id: eifId, length: 20, width: 40, height: 20, translation: [20, 0, 40] })).result
await api.v1.solid.union({ id: eifId, target: box1, tools: [box3] })
```

## Related

`solid/target-tools-pattern` · `solid.subtraction` · `solid.intersection` · `solid.merge` · `solid.copy`
