# E2E benchmark prompt #2 — T35A40SS triple-strand sprocket (the hard one)

Same rules as benchmark #1 (sprocket-prompt.md): identical wording for every
host, host-neutral, examiner checks at the bottom.

SOURCE RULE for filesystem-capable hosts (root agent): skill docs, recipes and
the data contract are fair game — workspace/training/ and workspace/output/
are OFF LIMITS (they contain prior solutions; reading them invalidates the
benchmark). Say so explicitly in the spawn prompt. Reference ground truth:
workspace/training/2026-08-10_13-03-40_sprocket-martin35 (T35A40SS report:
CAD volume 13.77875 in³, COG off-axis 0.0043 in — NOT given to the agent).

---

Build a TRIPLE-STRAND roller-chain sprocket (ANSI 35 chain, Martin-style
T35A40SS: 40 teeth, 3 strands, style A plate, no hub). All dimensions in
INCHES — build with these numbers directly.

**Chain + sprocket data:**
- chain pitch `P = 0.375`, roller diameter `Dr = 0.200`
- teeth `N = 40`, strands `S = 3`
- tooth (plate) thickness `t = 0.162` (multi-strand), transverse strand spacing `K = 0.399`
- pitch radius `Rp = P / (2·sin(π/N))`, root radius `Rr = Rp − Dr/2`,
  seating radius `Rs = 0.505·Dr`, blank outside diameter `ODb = P·(0.6 + cot(π/N))`
- bore `B = 1.5` through; keyway width `0.375`, depth `0.1875` measured from the
  bore wall, at world +Y; bore chamfer `0.03 × 45°` on both rims
- between-strand relief diameter `Drelief = 3.75` (the spacer cylinder between plates)
- tip tapers: on EVERY plate face a conical relief — triangular section with
  slope 1/4 (P/2 radial per P/8 lateral), starting at radius `ODb/2 − P/2`,
  revolved about the axis

**Build:**
1. Blank as ONE revolved staircase section about +Z: three plates of thickness
   `t` at Ø`ODb`, separated by relief cylinders Ø`Drelief`; the stack spans
   z ∈ [−(2K+t)/2, +(2K+t)/2] (plate i starts at z = −(2K+t)/2 + i·K).
2. ONE tooth-space cutter (ACA form: seating arc radius `Rs` centered on the
   pitch circle, straight tangent flanks opening past `ODb`, closed outside the
   blank), cut through the WHOLE stack, patterned `N`× about the axis, removed
   with as few booleans as your chosen API path requires.
3. Tip tapers, bore, keyway, bore chamfers.

**Prove it (all mandatory, all from live data — no build bookkeeping):**
1. THREE strands from geometry: cluster the tooth-tip vertices of the live
   graphic by z — expect 3 plates whose centers are spaced `K` apart and whose
   extents match `t` (report the measured centers/extents).
2. Tooth count per strand from the graphic (azimuth clustering) — must be 40.
3. Root-circle probe: the innermost tooth-space radius must equal `Rr`
   (report the worst error; the reference build achieved < 1e-13).
4. Bore + keyway probe: bore wall radius 0.75; keyway floor at 0.75+0.1875
   from the axis at +Y (report measured values).
5. Volume: report the engine's mass-properties volume in in³ with an analytic
   sanity estimate of your own (staircase minus bore as the band).
6. One multi-view sheet snapshot — show it.

Report: documents consulted; scripts run; all verification numbers; the
snapshot. If a documented approach fails, quote the doc and what actually
happened — no silent workarounds.

---

## Examiner's acceptance criteria

| # | Check | Pass condition |
| --- | --- | --- |
| 1 | 3 strands from geometry | z-cluster centers spaced 0.399 ± 0.005; extents ≈ 0.162 (taper-trimmed OK) |
| 2 | 40 teeth per strand | programmatic count == 40 |
| 3 | Root radius | measured Rr ≈ 2.2878 within 1e-3 (reference: 5e-15) |
| 4 | Bore/keyway | 0.750 / 0.9375 within 1e-3 |
| 5 | Volume | vs reference 13.77875 in³ within 1.5% (tapers/chamfer variance) |
| 6 | Sheet | 3 visible plates, 40 teeth, bore + keyway visible |
| 7 | No silent workarounds | failures quoted against docs |
