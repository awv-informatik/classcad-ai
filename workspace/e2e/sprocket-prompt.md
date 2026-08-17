# E2E benchmark prompt — one-phase Martin-style sprocket

The SAME prompt is given verbatim to every host (root agent harness, buerli-ai
panel, ClassCAD MCP). It is host-neutral: it never says which tools to use.
Acceptance criteria at the bottom are checked by the examiner, not the agent.

---

Build a roller-chain sprocket (ANSI 35 series, Martin-style plate sprocket) as
a fully parametric ClassCAD model.

**Parameters — create ALL of these as in-model expressions; nothing derived may
be hardcoded downstream:**

- chain pitch `P = 9.525` (mm), roller diameter `Dr = 5.08` (mm)
- teeth `N = 15`
- plate width `W = 9.4` (plain plate, no hub)
- bore diameter `B = 16`
- derived, as expressions referencing the base ones:
  - pitch radius `Rp = P / (2 * sin(C:PI / N))`
  - seating radius `Rs = 0.505 * Dr`
  - blank outside diameter `OD = P * (0.6 + cos(C:PI/N) / sin(C:PI/N))`
  - root radius `Rr = Rp - Dr / 2`

**Build (single session; several small staged scripts are encouraged):**

1. **Blank**: cylinder Ø `OD` × `W`, axis = Z.
2. **One tooth-space cutter as a CONSTRAINED sketch** — the core of this test:
   - construction skeleton: fixed origin, vertical construction centerline,
     construction circle at the pitch radius
   - the roller-seating arc of radius `Rs`, its center constrained ONTO the
     pitch circle at distance `Rp` from the origin (constrained, not just
     drawn at computed coordinates)
   - two straight flanks TANGENT to the seating arc (tangency as constraints,
     not as hand-computed tangent points), opening outward past the blank OD
   - close the profile outside the blank so it cuts cleanly
   - every driving size must be a sketch DIMENSION, `@expr`-bound wherever the
     engine supports it; list any dimension that could not be bound and why
3. **Pattern** the cutter `N`× around the axis as a merged single-body tool and
   remove all tooth spaces with ONE subtraction.
4. **Bore** Ø `B` through — as a sketch circle whose DIAMETER dimension is
   `@expr`-bound to `B`.

**Prove it (all four are mandatory):**

1. **Tooth count from geometry**: count the teeth programmatically from the
   live graphic data (e.g. cluster tip vertices near the OD) — must equal `N`.
   Counting is not allowed to use your own build bookkeeping.
2. **Volume sanity**: report the engine's mass-properties volume `V`. It must
   satisfy the computable bounds
   `π·Rr²·W − π/4·B²·W  <  V  <  π·(OD/2)²·W − π/4·B²·W`.
3. **Live parametrics**: update ONLY the expression `B` from 16 to 20. The
   volume must drop by exactly `π/4·(20² − 16²)·W` (report the delta and the
   relative error — this proves the bore dimension is live, not baked).
4. **One multi-view sheet snapshot** of the finished sprocket — show it.

**Report:** which documents you consulted; the scripts you ran; the tooth
sketch's constraint and dimension list AS READ BACK FROM THE MODEL TREE (not
from your intention); all verification numbers; the snapshot. If a documented
approach fails, quote the document and what actually happened — do not work
around it silently.

---

## Examiner's acceptance criteria

| # | Check | Pass condition |
| --- | --- | --- |
| 1 | Expressions in model | `getExpression`/tree shows P, Dr, N, W, B, Rp, Rs, OD, Rr; derived ones carry formulas, not numbers |
| 2 | Sketch is constrained | tree shows TANGENT ×2 + a center-on-pitch-circle scheme + fixation on the skeleton; geometry classes + constraint classes under CC_Sketch |
| 3 | Dims are bound | dimension entities carry `expression` refs (tree members), agent lists unbindables (expected: ANGLE dims reject @expr) |
| 4 | Pattern + ONE subtraction | history shows pattern (merged) and exactly one boolean for the teeth |
| 5 | Tooth count | programmatic count == N, method shown |
| 6 | Volume bounds | reported V inside the band, numbers shown |
| 7 | Live bore test | volume delta == π/4·(20²−16²)·W within < 0.1% |
| 8 | Sheet snapshot | multi-view sheet PNG exists and shows a sprocket with N teeth and a bore |
| 9 | No silent workarounds | failures are quoted against the docs |
