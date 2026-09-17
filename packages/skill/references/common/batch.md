# common.batch

Runs multiple API calls sequentially in one request. Drawing state from earlier jobs is visible to later ones.

## Key Parameters

- `jobs` — required `Array<{ api: string, param?: object }>`: `api` is the fully qualified name (`'v1.part.create'`), `param` the optional parameter object.

## Return Value

Standard full outer envelope; `result` is one entry per job, in order:

| Scenario | Per-job value |
|---|---|
| Success | `{ result }` — **only** `result`, no messages/maxLevel |
| Known API + error | `{ result: null, maxLevel: 51, messages: [...] }` |
| Unknown API name | **literal `null`** |

Outer `maxLevel` is the worst per-job level; outer `messages` include failed jobs' errors with `api: "v1.common.batch"`. All jobs OK → maxLevel 31, `messages: []`.

## Gotchas

- **Null-check per-job results** — `r.result[i].result` throws if job `i` used an unknown API name.
- **Don't read `job.maxLevel` on success** — the key doesn't exist.
- **Non-aborting.** A failed job doesn't stop later jobs.
- **No result forwarding.** Later jobs can't reference earlier results (you'd need IDs known in advance, or separate calls); drawing mutations (e.g. `part.create`) are visible though.
- `jobs: []` is valid → `result: []`, maxLevel 31. Single-job batches work but are pointless.
- Detect failures with outer `r.maxLevel >= 51`, then scan `r.result`.

## Common Errors

- `"Unknown command v1.fake.nonexistent"` (code 1201) — bad API name; per-job result `null`.
- `"Expression ... could not be evaluated."` (code 0) — known API, bad params; per-job `{ result: null, maxLevel: 51, messages }`.

## Working Example

```js
const r = await api.v1.common.batch({
  jobs: [
    { api: 'v1.common.getAppVersion' },
    { api: 'v1.common.evaluateExpression', param: { expression: '6*7' } },
  ],
})
// r.result → [{ result: "" }, { result: 42 }], r.maxLevel → 31

for (const job of r.result) {
  if (job === null) continue          // unknown API
  if (job.maxLevel >= 51) continue    // known API error
  console.log(job.result)
}
```

## Related

Any API can be a job via its fully qualified name · envelope protocol: `generic.md`
