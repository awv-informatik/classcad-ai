# Training: Booleans (Deep)

**Date:** 2026-03-20

## Goal

Deep training on `v1.part.boolean` and `v1.part.updateBoolean`. Prior session (2026-03-19) left AGENT NOTEs covering basics — this session goes deeper with systematic coverage.

**Methods to cover:**

- `boolean` — all 3 types: UNION, SUBTRACTION, INTERSECTION
- `boolean` params: id, type, target, tools, name
- `boolean` target/tools with `indices` (multi-solid features)
- `boolean` target/tools as plain IDs vs object `{ id, indices }` syntax
- `updateBoolean` — change type, change target, change tools, change name
- `updateBoolean` — what does it return? what's the open/close workflow?

**Test plan:**

1. Basic UNION — two overlapping boxes
2. Basic SUBTRACTION — cut a hole from a block
3. Basic INTERSECTION — overlapping boxes
4. Named booleans — custom `name` param
5. Multiple tools — subtract 3+ features at once
6. Tools with indices — pattern feature, select specific instance
7. Target with indices — multi-solid target, pick one
8. Non-overlapping bodies — union, subtraction, intersection
9. Same feature as target and tool — error case
10. Invalid/missing params — no target, no tools, wrong IDs, empty tools
11. Boolean on boolean — chain booleans
12. updateBoolean — change type (UNION→SUBTRACTION)
13. updateBoolean — change target
14. updateBoolean — change tools
15. updateBoolean — change name
16. updateBoolean — invalid ID / wrong feature type
17. Intersection with 3+ overlapping bodies
18. Large tool count — many tools in one call
19. Boolean + fillet interaction
20. Boolean + pattern interaction (pattern a boolean feature)
