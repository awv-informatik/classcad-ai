# Changes: Expression Workflow

## New Files

- `references/part/expression-workflow.md` — comprehensive workflow guide covering the full expression lifecycle: three binding types (inline/static, @expr/live, linkWithExpression/live), cascade chains, expression-driven WCS, multi-feature sharing, link/unlink/relink patterns, and a recommended parametric model pattern.

## Updated Files

- `references/part/renameExpression.md` — added WARNING section: rename breaks @expr feature bindings (features freeze at old value, no warning emitted). Includes workaround (re-link after rename).
- `references/part/deleteExpression.md` — clarified that delete also applies to linkWithExpression bindings, and no warning is emitted about orphaned features.

## Key Findings

1. **Three binding types:** inline formulas are static (evaluated once); @expr and linkWithExpression are live (track expression updates). Tested side-by-side in script 15.
2. **Rename breaks @expr bindings** — formula references auto-update but feature @expr bindings do NOT follow the rename. Feature freezes silently.
3. **Delete freezes linked features** — same as unlink behavior, no warning.
4. **Snapshot may mask stale geometry** — rendering appears to trigger recalc, so skipping `common.recalc()` may not show stale geometry visually. Always call recalc explicitly.
5. **Full cascade works** — base expr → derived expr → WCS offset → feature geometry, all update in one recalc.
