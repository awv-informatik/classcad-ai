# part.updateExpression

Updates existing named expressions in a part — numeric values and formula strings.

## Key Parameters

- `id` — part ID (required). Missing → result=null, code 1004. Invalid → result=null, code 1006.
- `toUpdate` — array of `{ name, value }` (required for actual updates)
  - `name` — must match an existing expression. Non-existent → result=0, code 1014.
  - `value` — `real | string`. Numbers set direct values; strings are parsed as formulas.

## CRITICAL: Use the `toUpdate` Array

```js
// ✅ CORRECT
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'size', value: 120 }] })

// ❌ WRONG — silent no-op: result=1, maxLevel=31, no messages, value UNCHANGED
await api.v1.part.updateExpression({ id: partId, name: 'size', value: 120 })
```

## Return Value

- **Success:** `result: 1` (numeric — check `result === 1`, not `=== true`), `messages: []`, `maxLevel: 31`
- **Logical failure** (non-existent name, broken formula): `result: 0`, `maxLevel: 51`, with messages
- **Parameter error** (missing id/name/value): `result: null`, `maxLevel: 51`, code 1004 or 1006

## Batch Behavior — ATOMIC

If ANY item fails, ALL updates are rolled back: `toUpdate: [{ name: 'a', value: 100 }, { name: 'nope', value: 999 }, { name: 'b', value: 200 }]` (`nope` doesn't exist) → result=0, `a` and `b` UNCHANGED, only the `nope` error is reported.

## Value Types

| Value | Example | After getExpression |
|---|---|---|
| Numeric | `value: 42` | `{ expression: "", value: 42 }` |
| Formula | `value: 'base * 3'` | `{ expression: "base * 3", value: 150 }` |
| Constant | `value: 'C:PI'` | `{ expression: "C:PI", value: 3.14159... }` |
| Mixed | `value: 'C:PI * 2'` | `{ expression: "C:PI * 2", value: 6.28318... }` |

Switching between types works freely (numeric↔formula, formula→constant, etc.).

## Invalid Formula Behavior

- **Syntax error** (e.g. `'2++3'`): result=0, maxLevel=51. **Fully rejected** — old value AND old formula preserved.
- **Undefined variable** (e.g. `'ghost + 99'`): result=0, maxLevel=51. **Half-applied** — the formula string IS stored but the old numeric value is preserved, leaving a broken expression that shows the formula but evaluates to the previous value.

This differs from `expression()` creation, where broken formulas get seed value 1.

## Cascade & Timing

- **Everything updates immediately in one call** — expression values, derived expressions (`base` → `doubled = base * 2`), and geometry of features bound via `@expr.NAME` or `linkWithExpression`. No `recalc()` needed.
- **Cross-references in the same call resolve.** Updating `base` and `derived = 'base * 3'` in one `toUpdate` array: derived sees the new base.
- **Scope is the target part, then its assemblies.** The call re-evaluates this part's `ExpressionSet`, regenerates its features, and solves every assembly that contains the part (constrained instances move). Other parts that read this part's values by path (`Params.ExpressionSet.W`) are not re-evaluated — refresh them with their own `updateExpression` or `common.recalc()`. Pattern: `recipes/assembly-parameters`.

## Edge Cases

- **Empty `toUpdate: []` or omitted** — no-op, result=1.
- **Same value** — result=1, no error. The part is still re-evaluated and its assemblies solved, so re-assigning the current formula works as a refresh (e.g. to pick up a changed `Params.ExpressionSet.W`).
- **Duplicate names** — last wins: `[{ name: 'x', value: 100 }, { name: 'x', value: 200 }]` → x=200.
- **Array param form** — `updateExpression([{ id: partA, toUpdate: [...] }, { id: partB, toUpdate: [...] }])` updates several parts in one call.

## Common Errors

| Error | Code | Meaning |
|---|---|---|
| "X does not exist and can not be modified" | 1014 | Expression name not found |
| "value must be provided" | 1004 | Missing `value` in toUpdate item |
| "name must be provided" | 1004 | Missing `name` in toUpdate item |
| "id must be provided" | 1004 | Missing `id` parameter |
| "invalid id" | 1006 | Bogus id string |
| "is not a valid expression" | 0 | Syntax error in formula |
| "Datamember X not found" | 0 | Formula references undefined expression |

## Working Example

```js
const partId = (await api.v1.part.create({ name: 'Test' })).result

await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'width', value: 100 },
    { name: 'height', value: 50 },
    { name: 'area', value: 'width * height' },
  ],
})

// Update width — area auto-cascades
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'width', value: 200 }] })
// getExpression('area') → { expression: "width * height", value: 10000 }

// Switch area from formula to number
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'area', value: 9999 }] })
// getExpression('area') → { expression: "", value: 9999 }
```

## Related

`part.expression` · `part.getExpression` · `part.deleteExpression` · `part.renameExpression` · `common.recalc`
