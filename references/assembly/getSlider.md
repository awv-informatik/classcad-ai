# assembly.getSlider

Returns the slider constraint with the specified name from a given assembly or product.

## Prerequisites

- An existing slider constraint in the assembly

## Key Parameters

- `id` (required) — assembly or product ID to search in. **Must be assembly ID, not instance ID** — instance-based lookup returns null with maxLevel 51
- `name` (required) — the name of the slider constraint to find

## Return Value

On success, returns an object with:

```js
{
  id: 216,            // constraint ID
  name: 'MySlider',
  mate1: { path: [204], csys: 107, flip: 'Z', reorient: '0' },
  mate2: { path: [206], csys: 198, flip: 'Z', reorient: '0' },
  xOffset: 10,
  yOffset: -5,
  zOffsetLimits: { min: -25, max: 35 }
}
```

- On not found: `null`, maxLevel 51
- Limits with no restrictions: `{ min: null, max: null }`

## Gotchas

- **Assembly ID required.** Passing an instance ID returns null — use the assembly/product ID.
- **Duplicate names:** If multiple sliders share the same name, returns the first one created.
- **Cross-type name collision:** If a non-slider constraint (e.g., fastened) was created first with the same name, getSlider returns null even though a slider with that name exists. The lookup matches the first constraint with that name regardless of type, then fails type validation.

## Working Example

```js
const result = (await api.v1.assembly.getSlider({ id: asmId, name: 'MySlider' })).result
if (result) {
  console.log('offset:', result.xOffset, result.yOffset)
  console.log('limits:', result.zOffsetLimits)
}
```

## Related

- `assembly.slider` — create the constraint
- `assembly.updateSlider` — modify after creation
