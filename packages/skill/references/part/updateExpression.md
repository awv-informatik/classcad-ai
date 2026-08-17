# part.updateExpression

Updates existing named expressions in a part. Can change both numeric values and formula strings.

## Prerequisites

- A part (`part.create`)
- Expressions already created via `part.expression`

## Key Parameters

- `id` — part ID (required). Missing → result=null, code 1004. Invalid → result=null, code 1006.
- `toUpdate` — array of `{ name, value }` objects (required for actual updates)
  - `name` — string, must match an existing expression. Non-existent → result=0, code 1014.
  - `value` — `real | string`. Numbers set direct values. Strings are parsed as formulas.

## CRITICAL: Use `toUpdate` Array

**The most dangerous gotcha with this API.** You MUST wrap updates in a `toUpdate` array:

```js
// ✅ CORRECT — uses toUpdate array
await api.v1.part.updateExpression({
  id: partId,
  toUpdate: [{ name: 'size', value: 120 }],
})

// ❌ WRONG — direct name/value params. Returns result=1, NO error, but value is UNCHANGED.
await api.v1.part.updateExpression({ id: partId, name: 'size', value: 120 })
```

The wrong form is a **silent no-op**: result=1, maxLevel=31, no error messages, value unchanged. There is zero indication that anything went wrong.

## Return Value

- **Success:** `result: 1` (numeric, not boolean `true`), `messages: []`, `maxLevel: 31`
- **Logical failure** (non-existent name, broken formula): `result: 0`, `maxLevel: 51`, with error messages
- **Parameter error** (missing id/name/value): `result: null`, `maxLevel: 51`, code 1004 or 1006

Check `result === 1` for success, not `result === true`.

## Batch Behavior — ATOMIC

The `toUpdate` array is processed **atomically**. If ANY item fails, ALL updates are rolled back:

```js
// One bad name kills the entire batch — 'a' and 'b' stay at original values
await api.v1.part.updateExpression({
  id: partId,
  toUpdate: [
    { name: 'a', value: 100 },   // valid
    { name: 'nope', value: 999 }, // does not exist → result=0
    { name: 'b', value: 200 },   // valid but NOT applied
  ],
})
// a and b are UNCHANGED. Only 'nope' error is reported.
```

## Value Types

All value types work in updates:

| Value | Example | After getExpression |
|---|---|---|
| Numeric | `value: 42` | `{ expression: "", value: 42 }` |
| Formula | `value: 'base * 3'` | `{ expression: "base * 3", value: 150 }` |
| Constant | `value: 'C:PI'` | `{ expression: "C:PI", value: 3.14159... }` |
| Mixed | `value: 'C:PI * 2'` | `{ expression: "C:PI * 2", value: 6.28318... }` |

Switching between types works freely: numeric→formula, formula→numeric, formula→constant, etc.

## Invalid Formula Behavior

Two distinct failure modes:

- **Syntax error** (e.g., `'2++3'`): result=0, maxLevel=51. **Fully rejected** — old value AND old formula preserved.
- **Undefined variable** (e.g., `'ghost + 99'`): result=0, maxLevel=51. **Half-applied** — the formula string IS stored but the old numeric value is preserved. This creates a broken expression that shows the formula but evaluates to the previous value.

This differs from `expression()` creation, where broken formulas get seed value 1.

## Cascade & Timing

- **Everything updates immediately.** Expression values, derived expressions, and feature geometry all update in a single `updateExpression` call — no `recalc()` needed.
- **Derived expressions auto-cascade.** Updating `base` immediately propagates to `doubled = base * 2`.
- **Cross-references in same call work.** Updating `base` and `derived = 'base * 3'` in one `toUpdate` array correctly resolves: derived sees the new base value.
- **Feature geometry recalculates automatically.** Features bound via `@expr.NAME` or `linkWithExpression` update their geometry as part of the `updateExpression` response.

```js
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'S', value: 100 }] })
// getExpression('S') → 100 immediately
// Box using @expr.S has already updated geometry
```

## Edge Cases

- **Empty `toUpdate: []`** — no-op, result=1.
- **Omitted `toUpdate`** — no-op, result=1.
- **Same value** — no-op, result=1 (no error for redundant update).
- **Duplicate names** — last wins. `[{ name: 'x', value: 100 }, { name: 'x', value: 200 }]` → x=200.
- **Array param form** — does NOT work. Passing an array of `{ id, toUpdate }` objects returns result=null, code 1001. Use separate calls for different parts.

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

// Create expressions
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'width', value: 100 },
    { name: 'height', value: 50 },
    { name: 'area', value: 'width * height' },
  ],
})

// Update width — area auto-cascades
await api.v1.part.updateExpression({
  id: partId,
  toUpdate: [{ name: 'width', value: 200 }],
})
// getExpression('area') → { expression: "width * height", value: 10000 }

// Change area from formula to constant
await api.v1.part.updateExpression({
  id: partId,
  toUpdate: [{ name: 'area', value: 9999 }],
})
// getExpression('area') → { expression: "", value: 9999 }
```

## Related

- `part.expression` — create expressions (uses `toCreate` array)
- `part.getExpression` — read expression value and formula
- `part.deleteExpression` — remove expressions (uses `toDelete` array)
- `part.renameExpression` — rename expressions (uses `toRename` array)
- `common.recalc` — full drawing recalculation (not needed after `updateExpression` — geometry auto-updates)
