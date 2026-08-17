# Changes — common.batch

## New file: `references/common/batch.md`

```diff
+# common.batch
+
+Runs multiple API calls sequentially in a single request. Jobs execute in order; drawing state from earlier jobs is visible to later ones.
+
+## Key Parameters
+- `jobs` — `Array<{ api: string, param?: object }>`
+
+## Per-job result shapes:
+| Success | `{ result }` only |
+| Known API + error | `{ result: null, maxLevel: 51, messages: [...] }` |
+| Unknown API name | literal `null` |
+
+## Gotchas
+- Unknown API → null (not object) — must null-check
+- Per-job success has NO messages/maxLevel keys
+- Batch is non-aborting — all jobs run regardless of failures
+- Cannot reference earlier job results in later job params
+- Empty jobs array is valid
+
+## Error codes
+- code 1201: Unknown command
+- code 0: Known API with bad params
```
