# common.getClassFileVersion

Returns the class file version string. No parameters (`{}` or none; extra params ignored). Stateless — works on an empty drawing.

## Return Value

`string` — observed value is `""` (docs say "class file version", but it's empty on this server). maxLevel 31, `messages: []`. Stable across calls and unaffected by drawing state (before/after `part.create`).

## Gotchas

- Returns `""` — don't parse it expecting any format.
- Identical to `getAppVersion` (both `""`, maxLevel 31) — either works as a **connection health check** (maxLevel 31 = server reachable).

## Working Example

```js
const r = await api.v1.common.getClassFileVersion({})
// r.result → "", r.maxLevel → 31, r.messages → []
```

## Related

`common.getAppVersion` · `common.batch`
