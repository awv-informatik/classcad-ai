# common.getClassFileVersion

Returns the class file version string. Takes no parameters.

## Prerequisites

None — stateless query, works on an empty drawing with no objects.

## Key Parameters

None. Accepts `{}` or no argument. Extra/unknown parameters are silently ignored.

## Return Value

- **Type:** `string`
- **Observed value:** `""` (empty string) — the server does not expose its class file version. Docs say it returns "class file version" but in practice it's empty.
- **maxLevel:** 31 (info) on success
- **messages:** `[]` (empty array)

The result is stable across repeated calls and unaffected by drawing state (before/after `part.create`).

## Gotchas

- Returns `""`, not an actual version string — do not parse it expecting any format.
- Identical behavior to `getAppVersion` — both return `""` with maxLevel 31 on this server. They are functionally interchangeable as health checks.

## Usage Hints

- Use as a **connection health check**: if the call succeeds (maxLevel 31), the server is reachable and responding.
- Interchangeable with `getAppVersion` for health checks — pick either one.
- Works with no argument or `{}` — both are valid.

## Working Example

```js
const r = await api.v1.common.getClassFileVersion({})
// r.result → "" (empty string)
// r.maxLevel → 31
// r.messages → []
```

## Related

- `common.getAppVersion` — same pattern, also returns `""` on this server
- `common.batch` — can include this as a batch job
