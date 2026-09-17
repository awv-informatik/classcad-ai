# The target/tools/keepTools Pattern

Shared by `solid.union`, `solid.subtraction`, `solid.intersection`, `solid.merge` — identical signatures and conventions.

## Signature

```js
api.v1.solid.<op>({ id, target, tools, keepTools? })
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `id` | EIF ID | required | Any valid entity injection feature (see below). |
| `target` | solid ID | required | Base solid, modified in place; its ID is returned. |
| `tools` | solid ID[] | required | Applied to the target; consumed (deleted) by default. |
| `keepTools` | boolean | `false` | `true` keeps tool IDs valid. |

## Return Value

The **target solid ID** (not a new ID), maxLevel=31, messages=[].
Exception: `subtraction` and `intersection` return `null`, maxLevel=51, code 1014 when the target is destroyed (tool fully envelops target, or no overlap for intersection).

## Universal Behaviors (all 4 operations)

- **keepTools: false** (default) — tool IDs are **immediately invalid**; any later reference (translate, copy, another boolean) returns `"...has an invalid id!"` (code 1006, maxLevel 51) — a clean error, not a hang. Track which IDs are still valid. **keepTools: true** — tools stay valid and can be translated, copied, reused.
- **`tools: []`** — silent no-op; returns target ID, maxLevel=31. Don't rely on error detection for it.
- **Tool order** does not affect the result (`[A, B]` ≡ `[B, A]`, identical structure tree and visuals).
- **Multi-tool** `[A, B, C]` ≡ three sequential single-tool calls. Prefer multi-tool (fewer round-trips).
- **Target ID is stable** across arbitrarily mixed union/subtraction/intersection/merge chains (unless destroyed).
- **Invalid tool IDs:** `null` → code 1001 (wrong type); non-existent numeric or wrong type (string) → code 0. All maxLevel=51.
- **target === tool is rejected**: maxLevel 51, `"...requires distinct target and tool entities..."`, target preserved (previously hung the server). Use `solid.copy` first to boolean a solid with a copy of itself.

## `id` Parameter Semantics

`id` must be a valid EIF (part ID or bogus ID → code 1001 or 1006) but does **not** scope the operation: target and tools may come from other EIFs in the same part, for all 4 operations. Using the target's EIF is conventional and recommended.

## Tool Reuse Pattern

With `keepTools: true` one tool can be reused across operations, even of different types:

```js
const partId = (await api.v1.part.create({ name: 'ToolReuse' })).result
const eifId = (await api.v1.part.entityInjection({ id: partId })).result
const body1 = (await api.v1.solid.box({ id: eifId, length: 60, width: 60, height: 20 })).result
const body2 = (await api.v1.solid.box({ id: eifId, length: 60, width: 60, height: 20, translation: [0, 100, 0] })).result
const body3 = (await api.v1.solid.box({ id: eifId, length: 60, width: 60, height: 20, translation: [0, 200, 0] })).result
const tool = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 20 })).result

await api.v1.solid.subtraction({ id: eifId, target: body1, tools: [tool], keepTools: true })
await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 100, 0] })
await api.v1.solid.subtraction({ id: eifId, target: body2, tools: [tool], keepTools: true })
await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 100, 0] })
await api.v1.solid.union({ id: eifId, target: body3, tools: [tool] })  // last use — tool consumed
```

## Destroyed Target Behavior

After a target is destroyed (code 1014), operations on its ID behave **inconsistently**:

| Operation | Return value | maxLevel | Behavior |
|---|---|---|---|
| `solid.translation` | — | — | **Crashes the ClassCAD worker** (connection lost, process exits) |
| `solid.union` | `null` | 51 | Error: "There must be two valid solids" |
| `solid.merge` | **target ID** | 51 | Error (but misleadingly returns the dead ID) |

**Always check `maxLevel`**, not just the return value — merge's return alone looks like success. **Never reuse a destroyed target**: after an intersection reports "Target solid was removed", drop the id.

## Related

`solid.union` · `solid.subtraction` · `solid.intersection` · `solid.merge` · `solid.copy`
