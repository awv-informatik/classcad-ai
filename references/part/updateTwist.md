# part.updateTwist

Updates an existing twist feature. Requires `openFeature`/`closeFeature` wrapping.

## Prerequisites

- An existing twist feature created with `part.twist`
- Feature must be opened with `part.openFeature` before updating

## Key Parameters

- `id` — **twist feature ID** (not part ID). The ID returned by `part.twist`.
- All other params are optional and override the current values: `twistAngle`, `limit2`, `limit1`, `type`, `direction`, `twistCenter`, `capEnds`, `name`, `references`.

## Usage Pattern

```js
await api.v1.part.openFeature({ id: twistId })
await api.v1.part.updateTwist({ id: twistId, twistAngle: Math.PI, limit2: 120 })
await api.v1.part.closeFeature({ id: twistId })
```

## Gotchas

- **`openFeature` is required.** Without it: error 1200 "The provided feature is not allowed to update. It's not active and open."
- **Only changed params need to be passed.** Unspecified params keep their current values.
- **Can change type.** E.g., UP→SYMMETRIC works.
- **Can change capEnds.** Solid→sheet or sheet→solid.
- **`capEnds` is integer (1/0).** Same constraint as `part.twist`.

## Related

- [`part.twist`](twist.md) — create the feature
- [`part.openFeature`](openFeature.md) — must call before update
