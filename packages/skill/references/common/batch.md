# common.batch

Runs multiple API calls sequentially in a single request. Jobs execute in order; drawing state from earlier jobs is visible to later ones.

## Prerequisites

None — works with any valid API calls.

## Key Parameters

- `jobs` — `Array<{ api: string, param?: object }>`. Required. Each job specifies:
  - `api` — fully qualified API name (e.g., `'v1.common.getAppVersion'`, `'v1.part.create'`)
  - `param` — optional parameter object for the API call

## Return Value

- **Outer envelope:** `{ result: Array, messages, maxLevel, structure, graphic }` — standard full envelope
- **`result`:** array of per-job results, one entry per job, in order

### Per-job result shapes (critical — two different success/error shapes):

| Scenario | Per-job value |
|---|---|
| Success | `{ result }` — **only `result` key**, no messages/maxLevel |
| Known API + error | `{ result: null, maxLevel: 51, messages: [...] }` |
| Unknown API name | **literal `null`** — not an object |

**Always null-check per-job results before accessing `.result`.**

### Outer envelope behavior:

- `maxLevel` — reflects the **worst** per-job maxLevel (bubbles up)
- `messages` — includes errors from failed jobs, with `api: "v1.common.batch"`
- When all jobs succeed: maxLevel 31, messages `[]`

## Gotchas

- **Unknown API name returns `null`, not an error object.** Code like `r.result[i].result` will throw if job `i` used a bad API name. Always check `r.result[i] !== null` first.
- **Per-job success results have NO `messages` or `maxLevel` keys.** Don't check `job.maxLevel` on success — the key doesn't exist.
- **Batch is non-aborting.** A failed job does NOT stop subsequent jobs. All jobs run regardless of earlier failures.
- **You cannot reference earlier job results in later job params.** Jobs are independent calls — no variable interpolation. But drawing state mutations (e.g., `part.create`) ARE visible to subsequent jobs.
- **Empty `jobs: []` is valid** — returns `result: []`, maxLevel 31.

## Common Errors

- `"Unknown command v1.fake.nonexistent"` (code 1201) — bad API name. Per-job result is `null`.
- `"Expression ... could not be evaluated."` (code 0) — known API with bad params. Per-job result is `{ result: null, maxLevel: 51, messages: [...] }`.

## Usage Hints

- Use batch to reduce round-trips when you have multiple independent API calls.
- For sequential workflows (create part → add sketch → extrude), batch works but you can't pass IDs between jobs in params. You'd need to know the IDs in advance or use separate calls.
- Single-job batches are valid but pointless — just call the API directly.
- Check `r.maxLevel >= 51` on the outer envelope to detect any job failure, then iterate `r.result` to find which job(s) failed.

## Working Example

```js
const r = await api.v1.common.batch({
  jobs: [
    { api: 'v1.common.getAppVersion' },
    { api: 'v1.common.evaluateExpression', param: { expression: '6*7' } },
  ],
})
// r.result → [{ result: "" }, { result: 42 }]
// r.maxLevel → 31

// Safe iteration:
for (const job of r.result) {
  if (job === null) continue          // unknown API
  if (job.maxLevel >= 51) continue    // known API error
  console.log(job.result)             // success
}
```

## Related

- Any API can be called as a batch job via its fully qualified name
- Outer envelope follows the same protocol as all other API calls
