# The target/tools/keepTools Pattern

Cross-cutting reference for the boolean operation pattern shared by `solid.union`, `solid.subtraction`, `solid.intersection`, and `solid.merge`. All four operations use identical parameter signatures and follow the same conventions.

## Signature

```js
api.v1.solid.<op>({ id, target, tools, keepTools? })
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `id` | EIF ID | required | Must be a valid entity injection feature. See "id parameter semantics" below. |
| `target` | solid ID | required | The base solid. Modified in place. Its ID is returned on success. |
| `tools` | solid ID[] | required | Solids to apply to the target. Consumed (deleted) by default. |
| `keepTools` | boolean | `false` | When `true`, tool IDs remain valid after the operation. |

## Return Value

All four operations return the **target solid ID** on success (not a new ID). maxLevel=31, messages=[].

Exception: `subtraction` and `intersection` can return `null` with maxLevel=51 if the operation destroys the target (code 1014 — tool fully envelops target, or no overlap for intersection).

## Universal Behaviors (verified for all 4 operations)

### keepTools

- `keepTools: false` (default) — tool solid IDs become **immediately invalid**. Any subsequent call referencing a consumed tool (translate, copy, another boolean) returns a clean error: `"...has an invalid id!"` (code 1006, maxLevel 51).
- `keepTools: true` — tool solid IDs remain valid. Tools can be translated, copied, and reused in further boolean operations.

### Empty tools array

`tools: []` is a **silent no-op** for all 4 operations. Returns target ID unchanged, maxLevel=31.

### Tool ordering

Order of tools in the array does **not** affect the result. `tools: [A, B]` and `tools: [B, A]` produce identical geometry (verified by structure tree comparison and visual inspection).

### Multi-tool vs sequential

`tools: [A, B, C]` in one call produces **identical results** to three sequential single-tool calls. Multi-tool is preferred — fewer API round-trips, same geometry.

### Target ID stability

The target ID is stable across arbitrarily mixed boolean chains. You can freely alternate between union, subtraction, intersection, and merge on the same target ID — it never changes (unless the target is destroyed).

### Invalid tool IDs

All 4 operations handle invalid tool IDs uniformly:
- `null` → error code 1001 (wrong type), maxLevel=51
- Non-existent numeric ID → error code 0, maxLevel=51
- Wrong type (string) → error code 0, maxLevel=51

### Self-referencing (target === tool)

**Passing the same solid ID as both target and tool is rejected** with a clean error (`maxLevel 51`, `"...requires distinct target and tool entities..."`) across all boolean operations and merge. Previously this hung the server; it now returns an error and the target is preserved. Use `solid.copy` first if you need to boolean a solid with a copy of itself.

## `id` Parameter Semantics

The `id` parameter must be a valid entity injection feature ID (validated — passing a part ID or bogus ID errors with code 1001 or 1006). However, it does **not** need to be the EIF that owns the target or tools. Cross-EIF boolean operations work freely for all 4 operations.

In practice: always pass a valid EIF. Using the target's EIF is conventional and recommended, but the operation will succeed with any valid EIF in the same part.

## Cross-EIF Operations

Tools can come from a different EIF than the target. This works for all 4 operations (not just merge). The `id` parameter just needs to be any valid EIF.

## Tool Reuse Pattern

With `keepTools: true`, a single tool can be reused across multiple boolean operations — even different operation types:

```js
// Subtract tool from body1, keep it
await api.v1.solid.subtraction({ id: eifId, target: body1, tools: [tool], keepTools: true })

// Move tool and subtract from body2, keep it
await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 100, 0] })
await api.v1.solid.subtraction({ id: eifId, target: body2, tools: [tool], keepTools: true })

// Move tool and union with body3 (last use, consume it)
await api.v1.solid.translation({ id: eifId, target: tool, translation: [0, 100, 0] })
await api.v1.solid.union({ id: eifId, target: body3, tools: [tool] })
// tool is now consumed — do not reference
```

## Destroyed Target Behavior

When a target is destroyed (e.g., intersection of non-overlapping bodies, code 1014), subsequent operations on that target ID behave **inconsistently**:

| Operation | Return value | maxLevel | Behavior |
|---|---|---|---|
| `solid.translation` | target ID | 31 | **Silent no-op** — no error, no warning |
| `solid.union` | `null` | 51 | Error: "There must be two valid solids" |
| `solid.merge` | **target ID** | 51 | Error (but misleadingly returns the dead ID) |

**Always check `maxLevel`**, not just the return value. Merge in particular returns the dead target ID with an error — the return value alone looks like success.

## Gotchas Summary

1. **Consumed tool IDs are invalid.** Referencing one returns a clean `"...has an invalid id!"` error (code 1006), not a hang. Track which IDs are still valid.
2. **Self-boolean is rejected.** Passing the same ID as target and tool returns a clean error (`"...requires distinct target and tool entities..."`), not a hang.
3. **Empty tools is a no-op, not an error.** Don't rely on error detection for empty tools arrays.
4. **Destroyed targets are inconsistently handled.** Translation silently ignores them; merge returns misleading values.
5. **`id` doesn't scope the operation.** It must be a valid EIF but doesn't restrict which solids participate.

## Related

- `solid.union` — boolean add
- `solid.subtraction` — boolean subtract
- `solid.intersection` — boolean intersect
- `solid.merge` — geometry concatenation (not a boolean)
- `solid.copy` — duplicate a solid (use before self-boolean)
