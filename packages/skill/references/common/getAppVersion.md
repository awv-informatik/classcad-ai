# common.getAppVersion

Returns the application version string. No parameters (`{}` or none; extra params ignored). Stateless — works on an empty drawing.

## Return Value

`string` — observed value is `""`: the server does not expose its version (docs: "app version or empty string if not available"). maxLevel 31, `messages: []`. Stable across calls and unaffected by drawing state (before/after `part.create`).

## Gotchas

- Returns `""` — don't parse it expecting semver or any format. `getClassFileVersion` also returns `""`; both version APIs are effectively no-ops.
- Useful as a **connection health check**: maxLevel 31 means the server is reachable.
- Inside `common.batch` the successful inner envelope is only `{ result }` (no messages/maxLevel).

## Working Example

```js
const r = await api.v1.common.getAppVersion({})
// r.result → "", r.maxLevel → 31, r.messages → []
```

## Related

`common.getClassFileVersion` · `common.batch`
