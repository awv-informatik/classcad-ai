# Changes — part.setAppearance training session

## New file: `references/part/setAppearance.md`

Complete LLM doc for `part.setAppearance` — 123 lines covering:
- Functionally identical to `common.setAppearance`
- Consumed feature restriction (error 1014) — the most important gotcha
- Valid target types with notes on boolean VOID return and pattern indexing
- All parameters, edge cases, error codes
- Working example, persistence, related APIs

## Updated: `references/common/setAppearance.md`

Added findings from cross-testing with `part.setAppearance`:

```diff
+| Pattern feature (`linearPattern`, `circularPattern`) | ✅ | Supports per-instance indexing |
+| Boolean feature result | ❌ | `part.boolean` returns VOID — no ID to target |
+| Consumed feature (has downstream features) | ❌ | Error 1014: feature consumed by later operation |
```

```diff
+- **Consumed features fail with error 1014** — if a downstream feature (fillet, chamfer, pattern)
+  has consumed a base feature, `setAppearance` on the consumed feature returns error 1014
+  "Entity 'X' is not available." Only the **tip** (latest) feature in the chain accepts appearance.
+  This applies to both `common.setAppearance` and `part.setAppearance`.
```

```diff
+| "Entity 'X' is not available..." | 1014 | Target feature consumed by downstream feature |
+| "target = VOID is not allowed" | 1001 | Target is null (e.g., boolean returned VOID) |
```

```diff
+- `part.setAppearance` — identical behavior, different namespace
-  `common.requestVisualisation` — read back stored appearance data
+  `common.requestVisualisation` — read back stored appearance data (returns null in CLI mode)
```
