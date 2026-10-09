# solid.subtraction

Cuts tool solids from a target (boolean subtract). Shared rules (keepTools, empty tools, multi-tool, cross-EIF, destroyed targets): `solid/target-tools-pattern`.

## Key Parameters

- `id` — entity injection feature ID (not part ID)
- `target` — solid to cut from, modified in place; its ID is returned
- `tools` — cutting tool IDs; consumed unless `keepTools: true`
- `keepTools` — default `false`

## Return Value

- **Success (partial or full cut):** the **target solid ID**, maxLevel=31, messages=[].
- **Tool completely envelops target → target destroyed:** `null`, maxLevel=51, `"Target solid was removed by subtraction."` (code 1014).
- **`tools: []`:** target ID unchanged, maxLevel=31.

## Gotchas

- **Skip `common.recalc` after direct solid booleans** — results are already current. A recalc invalidates `curve.*` shape ids and has destroyed bodies in complex EIF sessions: a sprocket blank − many tools subtraction went from healthy to `calculateMassProperties` null (NullMem) after `common.recalc({})`. A simple 40×40×20 box − Ø10 cylinder subtraction survived a recalc, volume unchanged. Keep `recalc: false` (the default) on `api.graphic()` and snapshots.
- **Consumed tool IDs are rejected cleanly** — any later solid op on them (`solid.translation`, `solid.copy`, `solid.subtraction`, …) returns maxLevel 51, `"...has an invalid id!"` (code 1006), same as a never-existing ID; no hang.
- **Non-overlapping tools are silent no-ops** — target unchanged, but the tool is still consumed (unless `keepTools: true`).

## Usage Hints

- Target ID is stable across chained subtractions; subtraction from compound (e.g. union) results works.
- Multiple tools in one call is more efficient than sequential calls.
- `keepTools: true` to reuse a tool for several cuts (same hole in two bodies); let the last use consume it.
- **Visible cuts in snapshots:** cut the viewer-facing side (lower X, higher Y/Z in isometric view). Through-holes (tool taller than target) are the clearest evidence.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"Target solid was removed by subtraction."` | 1014 | Tool completely envelops target | Smaller tool, or check overlap first |
| `"...has an invalid id!"` (maxLevel 51) | 1006 | Consumed/deleted solid ID | Tool is gone after a default subtraction |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Target or tool ID doesn't exist | Verify IDs exist |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SubDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const box = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result

// Through-hole tool — consumed
const cyl = (await api.v1.solid.cylinder({ id: eifId, height: 80, diameter: 25, translation: [50, 40, -10] })).result
const r = await api.v1.solid.subtraction({ id: eifId, target: box, tools: [cyl] })
// r.result === box, maxLevel 31; cyl is now INVALID

// keepTools: same tool cuts two bodies
const body2 = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60, translation: [0, 150, 0] })).result
const tool = (await api.v1.solid.cylinder({ id: eifId, height: 100, diameter: 20, translation: [-25, 0, 0] })).result
await api.v1.solid.subtraction({ id: eifId, target: box, tools: [tool], keepTools: true })
await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 150, 0] })
await api.v1.solid.subtraction({ id: eifId, target: body2, tools: [tool] })  // last use — consumed
```

## Related

`solid/target-tools-pattern` · `solid.union` · `solid.intersection` · `solid.merge` · `solid.copy`
