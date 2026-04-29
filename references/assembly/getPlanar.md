# assembly.getPlanar

Retrieves a planar constraint by name from a product or instance.

## Key Parameters

- `id` (required) — assembly ID or instance ID to search in
- `name` (required) — constraint name to find

## Return Value

Returns the full constraint definition:

```js
{
  id: 212,
  name: 'SlidePlane',
  mate1: { path: [204], csys: 107, flip: 'Z', reorient: '0' },
  mate2: { path: [206], csys: 198, flip: '-Z', reorient: '90' },
  zOffset: 15,
  xOffsetLimits: { min: -50, max: 50 },
  yOffsetLimits: { min: -30, max: 30 },
  zRotationLimits: { min: -0.785, max: 2.356 }
}
```

- `zRotationLimits` values are always in **radians**, even if created with degree strings
- Unset limits show as `{ min: null, max: null }`
- Does NOT include current position/rotation — only the constraint definition

## Not Found

Returns `null` + maxLevel 51, code 0 with message: "There couldn't be found a constraint with name ... on product or product reference with id ..."

## Gotchas

- **Returns first match.** If multiple constraints share a name, only the first is returned.
- **Cross-type name collision.** Finds the FIRST constraint by name regardless of type. If a non-planar constraint with the same name was created first, getPlanar will fail.

## Related

- `assembly.planar` — create the constraint
- `assembly.updatePlanar` — modify after creation
