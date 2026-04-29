# assembly.getParallel

Retrieves a parallel constraint by name from an assembly.

## Key Parameters

- `id` (required) — assembly ID (NOT instance ID — instance ID returns VOID with error)
- `name` (required) — constraint name to find

## Return Value

Returns the full constraint definition:

```js
{
  id: 212,
  name: 'FloatPar',
  mate1: { path: [204], csys: 107, flip: 'Z', reorient: '0' },
  mate2: { path: [206], csys: 198, flip: '-Z', reorient: '90' },
  xOffsetLimits: { min: -40, max: 40 },
  yOffsetLimits: { min: -30, max: 30 },
  zOffsetLimits: { min: 0, max: 50 },
  zRotationLimits: { min: 0, max: 3.14159 }
}
```

- `zRotationLimits` values are always in **radians**, even if created with degree strings
- Unset limits show as `{ min: null, max: null }`
- Does NOT include current position/rotation — only the constraint definition

## Not Found

Returns `null` + maxLevel 51 when the name doesn't match any constraint.

## Gotchas

- **Must use assembly ID.** Passing an instance ID returns VOID with maxLevel 51 (error).
- **Returns first match.** If multiple constraints share a name, only the first is returned.
- **Cross-type name collision.** Finds the FIRST constraint by name regardless of type. If a non-parallel constraint with the same name was created first, getParallel will fail.

## Related

- `assembly.parallel` — create the constraint
- `assembly.updateParallel` — modify after creation
