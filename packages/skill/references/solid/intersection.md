# solid.intersection

Boolean intersection — keeps only the volume shared by target and tools. Signature, keepTools, empty tools, tool order, cross-EIF and destroyed-target rules: `solid/target-tools-pattern`.

## Key Parameters

- `id` — entity injection feature ID (not part ID)
- `target` — base solid, modified in place; its ID is returned
- `tools` — solid IDs to intersect with; consumed unless `keepTools: true`
- `keepTools` — default `false`

## Return Value

- **Overlap exists:** the **target solid ID**, maxLevel=31, messages=[].
- **Disjoint bodies:** `null`, maxLevel=51, `"Target solid was removed by intersection."` (code 1014). **The target is destroyed** — unlike union, which builds a compound from disjoint bodies. Same code as subtraction when the tool envelops the target. Verify overlap before calling.
- **`tools: []`:** target ID unchanged, maxLevel=31.

## Containment Cases

| Case | Result (no error) |
|---|---|
| Tool fully contains target | Target unchanged |
| Target fully contains tool | Target shrinks to the tool's shape |
| Partial overlap | Shared volume only; flat and curved surfaces preserved |

## Notes

- **Multiple tools = n-way intersection:** `tools: [A, B]` → `target ∩ A ∩ B`, all tools consumed. Same result as sequential calls, more efficient.
- Chaining keeps the target ID stable. Works across solid types (box ∩ cylinder → mixed planar/curved faces).
- `solid.copy` works on an overlapping intersection's result.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"Target solid was removed by intersection."` | 1014 | No overlap / empty overlap volume | Verify overlap before calling |
| `"...has an invalid id!"` (maxLevel 51) | 1006 | Consumed/invalid solid ID | Tools are gone after a default intersection |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'IntersectionDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const box1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result
const box2 = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 80, translation: [60, 30, -10] })).result

const r = await api.v1.solid.intersection({ id: eifId, target: box1, tools: [box2] })
// r.result === box1, maxLevel 31; box1 is now the overlap region; box2 is INVALID

// keepTools: reuse the tool on a second body
const body2 = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60, translation: [40, 140, -20] })).result
const tool = (await api.v1.solid.cylinder({ id: eifId, height: 120, diameter: 60, translation: [40, 40, -20] })).result
await api.v1.solid.intersection({ id: eifId, target: box1, tools: [tool], keepTools: true })
await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 100, 0] })
await api.v1.solid.intersection({ id: eifId, target: body2, tools: [tool] })
```

## Related

`solid/target-tools-pattern` · `solid.union` · `solid.subtraction` · `solid.merge` · `solid.copy`
