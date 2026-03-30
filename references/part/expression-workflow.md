# Expression Workflow (End-to-End)

How to build fully parametric models using expressions. This doc covers the complete lifecycle: create expressions → bind to features → update → observe geometry change.

## Three Binding Types

| Type | Syntax | Live? | When to use |
|---|---|---|---|
| Inline formula | `height: '30 + 30'` | **No** — evaluated once at creation | One-off computed values that never change |
| @expr reference | `height: '@expr.H'` | **Yes** — tracks expression updates | Bind at feature creation time |
| linkWithExpression | `linkWithExpression({ id: featureId, exprName: 'H', name: 'height' })` | **Yes** — tracks expression updates | Bind after feature creation (post-hoc) |

**@expr and linkWithExpression are functionally equivalent** for live bindings. Both respond to `updateExpression` immediately (geometry auto-updates, no `recalc()` needed). Inline formulas are static — changing expressions has no effect on them.

## Basic Lifecycle

```js
// 1. Create part
const partId = (await api.v1.part.create({ name: 'Parametric' })).result

// 2. Define expressions (master + derived)
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'baseL', value: 100 },
    { name: 'baseW', value: 80 },
    { name: 'thick', value: 10 },
    { name: 'wallH', value: 'baseL * 0.6' },  // derived
  ],
})

// 3. Create features with @expr bindings
await api.v1.part.box({
  id: partId, name: 'BasePlate',
  length: '@expr.baseL', width: '@expr.baseW', height: '@expr.thick',
})

// 4. Update expression → geometry changes immediately
await api.v1.part.updateExpression({
  id: partId, toUpdate: [{ name: 'baseL', value: 200 }],
})
// wallH auto-cascades to 120, all features update (geometry recalculates automatically)
```

## Post-Hoc Linking

Create feature with plain values first, bind to expressions later:

```js
const boxId = (await api.v1.part.box({
  id: partId, length: 80, width: 60, height: 40,  // plain values
})).result

// Later, bind height to expression H=120
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'H', name: 'height' })
// Box height is now 120

// Can link multiple params
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'L', name: 'length' })
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'W', name: 'width' })
```

## Unlinking (Freeze)

Unlink freezes the parameter at the expression's **current** value (NOT the original hard-coded value):

```js
// Box created with height=40, then linked to H=120
await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
// height is now plain value 120 (frozen), NOT 40
// Updating H no longer affects this box
```

After unlinking, you can re-link to a different expression:

```js
await api.v1.part.linkWithExpression({ id: boxId, exprName: 'B', name: 'height' })
```

## Cascade Chain

Derived expressions auto-cascade when their dependencies change:

```js
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'base', value: 50 },
    { name: 'doubled', value: 'base * 2' },   // 100
    { name: 'tripled', value: 'base * 3' },   // 150
  ],
})

await api.v1.part.box({
  id: partId,
  length: '@expr.tripled', width: '@expr.doubled', height: '@expr.base',
})

// Update base → derived exprs + features all update immediately
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'base', value: 80 }] })
// doubled=160, tripled=240 — full chain (geometry updates automatically)
```

## Expression-Driven WCS

WCS offsets accept @expr in string-encoded arrays:

```js
const wcsId = (await api.v1.part.workCSys({
  id: partId, name: 'StackWCS',
  offset: '[0, 0, @expr.spacing]',
})).result

// Updating 'spacing' moves the WCS and everything placed on it
```

## Multi-Feature Sharing

One expression can drive multiple features simultaneously:

```js
// Both boxes share the same 'size' expression
await api.v1.part.box({ id: partId, name: 'Box1', height: '@expr.size', ... })
await api.v1.part.box({ id: partId, name: 'Box2', height: '@expr.size', ... })

// Single update → both features change immediately
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'size', value: 120 }] })
```

Works across feature types — box and cylinder can share the same expression.

## Geometry Updates Immediately

`updateExpression` updates expression values, derived expressions, and feature geometry in a single call. No `common.recalc()` needed:

```js
await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 200 }] })
// getExpression('H') → 200 ✓
// Box geometry using @expr.H is already updated ✓
```

## Gotchas

- **Deleting a linked expression does NOT destroy the feature.** The parameter freezes at the expression's last value (same as unlink). No warning is emitted.
- **Renaming a linked expression BREAKS the binding.** Features that referenced the old name via @expr freeze at the last value. The feature does NOT auto-update to the new name. No warning. If you rename, you must re-link features afterward.
- **Inline formulas are dead strings.** `height: '30 + 30'` is evaluated once at creation and never updated. Use @expr for live bindings.
- **linkWithExpression silently accepts bad param names.** Linking to `'fakeParam'` returns success. Always verify parameter names.
- **unlinkExpression freezes at current value, not original.** A box created with height=40, linked to H=120, then unlinked → height=120 (not 40).

## Recommended Pattern: Parametric Model

```js
// 1. Create part
const partId = (await api.v1.part.create({ name: 'Model' })).result

// 2. Define ALL dimensions as expressions (master + derived)
await api.v1.part.expression({
  id: partId,
  toCreate: [
    { name: 'plateL', value: 100 },
    { name: 'plateW', value: 80 },
    { name: 'thick', value: 10 },
    { name: 'wallH', value: 'plateL * 0.6' },
  ],
})

// 3. Build features using @expr exclusively
await api.v1.part.box({ id: partId, name: 'Plate',
  length: '@expr.plateL', width: '@expr.plateW', height: '@expr.thick' })

const wcs = (await api.v1.part.workCSys({ id: partId, name: 'WallOrigin',
  offset: '[0, 0, @expr.thick]' })).result

await api.v1.part.box({ id: partId, name: 'Wall', references: [wcs],
  length: '@expr.thick', width: '@expr.plateW', height: '@expr.wallH' })

// 4. To resize: update master expressions (geometry updates automatically)
await api.v1.part.updateExpression({
  id: partId, toUpdate: [{ name: 'plateL', value: 200 }],
})
// Everything scales: wallH→120, WCS moves, wall resizes
```

## Related

- `part.expression` — create named expressions
- `part.getExpression` — read expression value
- `part.updateExpression` — change expression value (uses `toUpdate` array!)
- `part.deleteExpression` — remove expression (linked features freeze)
- `part.renameExpression` — rename expression (BREAKS @expr bindings!)
- `part.linkWithExpression` — post-hoc binding
- `part.unlinkExpression` — disconnect (freezes current value)
- `common.recalc` — full drawing recalculation (not needed after `updateExpression` — geometry auto-updates)
