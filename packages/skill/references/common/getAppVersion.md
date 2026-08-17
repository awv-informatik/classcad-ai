# common.getAppVersion

Returns the application version string. Takes no parameters.

## Prerequisites

None — stateless query, works on an empty drawing with no objects.

## Key Parameters

None. Accepts `{}` or no argument. Extra/unknown parameters are silently ignored.

## Return Value

- **Type:** `string`
- **Observed value:** `""` (empty string) — the server does not expose its version. Docs confirm: "app version or empty string if not available."
- **maxLevel:** 31 (info) on success

The result is stable across repeated calls and unaffected by drawing state (before/after `part.create`).

## Gotchas

- Returns `""`, not an actual version string — do not parse it expecting semver or any format.
- `getClassFileVersion` also returns `""` on the same server — both version APIs are effectively no-ops.

## Usage Hints

- Use as a **connection health check**: if the call succeeds (maxLevel 31), the server is reachable and responding.
- Works inside `common.batch` — inner envelope on success contains only `{ result }` (no messages/maxLevel keys).

## Working Example

```js
const r = await api.v1.common.getAppVersion({})
// r.result → "" (empty string)
// r.maxLevel → 31
// r.messages → []
```

## Related

- `common.getClassFileVersion` — same pattern, also returns `""` on this server
- `common.batch` — can include this as a batch job
