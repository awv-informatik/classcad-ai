# assembly.getSpherical

Retrieves a spherical constraint by name from an assembly or instance.

## Key Parameters

- `id` (required) — assembly ID (or product/instance ID) to search in
- `name` (required) — constraint name to look for

## Return Value

On success (maxLevel 31):
```js
{
  id: 216,                    // constraint ID
  name: 'BallJoint1',
  mate1: {
    csys: 107,                // WCS ID
    flip: 'Z',                // main axis
    path: [204],              // instance path
    reorient: '0'             // orientation string
  },
  mate2: { csys, flip, path, reorient },
  yRotationLimits: {
    max: 1.0471975511965976   // radians, or null if unlimited
  }
}
```

On not found: `null`, maxLevel 51.

## Gotchas

- **Requires assembly/product ID, not instance ID.** Passing an instance ID returns null with maxLevel 51.
- **Returns first match.** If multiple constraints share a name, only the first is returned.
- **yRotationLimits.max is always present** — either as a radian value or `null`. No `min` property exists.
- **Degree expressions stored as radians.** `'60deg'` → `1.0471975511965976`.

## Related

- `assembly.spherical` — create the constraint
- `assembly.updateSpherical` — modify after creation
