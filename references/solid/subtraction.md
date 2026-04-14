# solid.subtraction

Cuts tool solids from a target solid (boolean subtract). The target is modified in place — tool solids are consumed (deleted) by default.

## Prerequisites

- A part (`part.create`)
- An entity injection feature (`part.entityInjection`)
- At least two solids in the same EIF (one target, one or more tools)

## Key Parameters

- `id` — entity injection feature ID (not part ID)
- `target` — solid ID to cut from. This solid is modified in place and its ID is returned on success.
- `tools` — array of solid IDs to use as cutting tools. All tools are consumed (deleted) unless `keepTools: true`.
- `keepTools` — boolean, default `false`. When `true`, tool solids remain as separate, valid solids after the subtraction. When `false` (default), tool solid IDs become invalid immediately after the call.

## Return Value

- **Success (partial or full cut):** Returns the **target solid ID**. maxLevel=31, messages=[].
- **Target destroyed:** Returns `null` (VOID). maxLevel=51, error message: `"Target solid was removed by subtraction."` (code 1014). This happens when the tool completely envelops the target.
- **Empty tools:** Returns target ID unchanged (no-op). maxLevel=31.

## Gotchas

- **CRITICAL: Never pass consumed solid IDs to any solid operation.** After a default subtraction (keepTools=false), referencing a tool solid ID in `solid.translation`, `solid.copy`, `solid.subtraction`, etc. **hangs the ClassCAD server** — 100% CPU, no response, requires `kill -9` and worker restart. This is the same hang behavior documented for self-union. Always track which IDs are still valid.
- **Non-overlapping tools are silent no-ops.** A tool that doesn't intersect the target produces no error — the target is unchanged, but the tool is still consumed (unless keepTools=true).
- **Tool enveloping target destroys the target.** If the tool completely contains the target, the subtraction removes the target entirely. Result is null, maxLevel=51, code 1014.
- **Empty tools array is a no-op.** `tools: []` succeeds silently — returns target ID unchanged, maxLevel=31.

## Usage Hints

- **Chained subtractions work.** The target ID stays stable across multiple sequential subtractions. Create a new tool, subtract it, repeat.
- **Multiple tools in one call is more efficient** than sequential subtractions. All tools are applied in one operation.
- **Use `keepTools: true` when you need the tool for multiple cuts** (e.g., same cylinder hole in two different bodies). The first subtraction preserves the tool; the last one can consume it.
- **Subtraction from compound solids works.** You can subtract from a union result — boolean operations compose freely.
- **For visible cuts in snapshots**, position the tool to cut the viewer-facing side (lower X, higher Y/Z in isometric view). Through-holes (tool taller than target) produce the clearest visual evidence.

## Common Errors

| Error | Code | Cause | Fix |
|---|---|---|---|
| `"Target solid was removed by subtraction."` | 1014 | Tool completely envelops target | Use a smaller tool, or check overlap before subtracting |
| Server hang (100% CPU, no response) | — | Operating on consumed solid ID | Track valid IDs. Never reference consumed tools. |
| `"An element of parameter \"target\" has an invalid id!"` | 1006 | Target or tool ID doesn't exist | Verify IDs exist before calling |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'SubDemo' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result

// Base box
const box = (await api.v1.solid.box({
  id: eifId, length: 100, width: 80, height: 60
})).result

// Cylinder tool — through-hole
const cyl = (await api.v1.solid.cylinder({
  id: eifId, height: 80, diameter: 25,
  translation: [50, 40, -10]
})).result

// Subtract — cyl is consumed
const r = await api.v1.solid.subtraction({ id: eifId, target: box, tools: [cyl] })
// r.result === box (target ID returned)
// r.maxLevel === 31 (success)
// cyl is now INVALID — do not reference it

// Chain another subtraction
const cyl2 = (await api.v1.solid.cylinder({
  id: eifId, height: 80, diameter: 15,
  translation: [25, 40, -10]
})).result

await api.v1.solid.subtraction({ id: eifId, target: box, tools: [cyl2] })
// box now has two cylindrical holes
```

### keepTools example

```js
const tool = (await api.v1.solid.cylinder({
  id: eifId, height: 100, diameter: 20,
  translation: [50, 40, -20]
})).result

// Cut from first body, keep the tool
await api.v1.solid.subtraction({ id: eifId, target: body1, tools: [tool], keepTools: true })

// Reuse same tool on second body (last use, let it be consumed)
await api.v1.solid.subtraction({ id: eifId, target: body2, tools: [tool] })
```

## Related

- `solid.union` — boolean union (same target/tools/keepTools pattern)
- `solid.intersection` — boolean intersect (same pattern)
- `solid.merge` — NOT a boolean operation (different semantics)
- `solid.copy` — duplicate a solid before consuming it
