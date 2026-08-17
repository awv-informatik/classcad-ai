# E2E benchmark #3 prompt — double-strand sprocket WITH hub (style C)

The SAME prompt is given verbatim to every host (root agent harness, buerli-ai
panel, ClassCAD MCP). Host-neutral; acceptance criteria at the bottom are
checked by the examiner, not the agent. New vs #2: revolved HUB collar on both
sides, radial set screw, and the flank angle is PINNED (bench #2 showed the
volume drifts when the flank splay is left free).

---

Build a DOUBLE-STRAND roller-chain sprocket WITH HUB (ANSI 35 chain,
Martin-style D35C13SS: 13 teeth, 2 strands, style C — hub collar on BOTH
sides). All dimensions in INCHES — build with these numbers directly.

**Chain + sprocket data:**
- chain pitch `P = 0.375`, roller diameter `Dr = 0.200`
- teeth `N = 13`, strands `S = 2`
- plate thickness `t = 0.162`, transverse strand spacing `K = 0.399`
- pitch radius `Rp = P / (2·sin(π/N))`, root radius `Rr = Rp − Dr/2`,
  seating radius `Rs = 0.505·Dr`, blank outside diameter `ODb = P·(0.6 + cot(π/N))`
- tooth space form (ACA): seating arc radius `Rs` whose lowest point lies
  exactly on the root circle, straight flanks TANGENT to the seating arc at
  the ANSI flank angle `(35 − 60/N)°` from the tooth-space centerline,
  opening past `ODb`
- tip tapers: on all 4 plate faces a conical relief — triangular section with
  slope 1/4 (P/2 radial per P/8 lateral), starting at radius `ODb/2 − P/2`
- **hub (the collar)**: diameter `Dhub = 1 7/64 = 1.109375`, projecting
  `0.4` beyond the plate stack on EACH side (style C); between the two
  plates a relief/spacer cylinder of the SAME diameter `1.109375`
- geometry along the axis (z, stack centered on the origin): plates of
  thickness `t` starting at z = −(K+t)/2 and at z = −(K+t)/2 + K; spacer
  between them; hub collars from each stack end outward 0.4 →
  total length through bore `LTB = (K + t) + 0.8 = 1.361`
- **bore** `B = 0.625` through everything; **keyway** width `3/16`, depth
  `3/32` measured from the bore wall, at world +Y, through the full LTB;
  bore chamfers `0.03 × 45°` on both rims
- **set screw**: ONE radial tapped hole Ø `1/4`, axis at 90° from the keyway
  (i.e. along +X), centered on the BACK hub collar (z = +0.4805), drilled
  from the hub OD through into the bore

**Build:** blank as ONE revolved section about +Z (hub – plate – spacer –
plate – hub staircase), one ACA tooth-space cutter through the whole stack,
patterned `N`× and removed with as few booleans as your API path requires;
then tapers, bore, keyway, set-screw hole, chamfers.

**Prove it (all mandatory, all from live data — no build bookkeeping):**
1. TWO strands from geometry: cluster tooth-tip vertices by z — 2 plates,
   centers ±K/2, extents t (report measured centers/extents).
2. Tooth count per strand from the graphic — must be 13.
3. Root-circle probe: innermost tooth-space radius = `Rr` (report worst
   error; brep-level probes reach ~1e-15).
4. HUB probe: hub cylindrical faces at radius `1.109375/2` on both sides;
   overall z-extent = `LTB = 1.361`; spacer between the plates at the same
   radius (report measured values).
5. Bore + keyway probe: bore wall radius `0.3125`; keyway floor at
   `0.3125 + 0.09375 = 0.40625` from the axis at +Y.
6. Set-screw probe: a Ø0.25 radial hole at +X, centered z = 0.4805, reaching
   the bore (show it in a section).
7. Volume: engine mass-properties volume in in³ with your OWN analytic
   sanity estimate (staircase bands minus bore as the bracket).
8. One multi-view sheet snapshot AND one axis-section snapshot — show both.

Report: documents consulted; scripts run; all verification numbers; the
snapshots. If a documented approach fails, quote the doc and what actually
happened — no silent workarounds.

---

## Examiner's acceptance criteria

Derived values (examiner-side): Rp = 0.783486, Rr = 0.683486,
ODb = 1.746434, flank half-angle = 30.3846°.

| # | Check | Pass condition |
| --- | --- | --- |
| 1 | Strands | 2 z-clusters at the plate mid-planes ±K/2 = ±0.1995, extents 0.162 |
| 2 | Teeth | 13 per strand, from graphic |
| 3 | Root radius | = Rr within 1e-6 (brep probes ~1e-15 expected) |
| 4 | Hub/collar | radius 0.5546875 both collars + spacer; z-extent 1.361 total |
| 5 | Bore/keyway | 0.3125 / floor 0.40625 at +Y |
| 6 | Set screw | Ø0.25 at +X, z ≈ 0.4805, pierces to the bore |
| 7 | Volume | inside the computable band [1.00, 1.37] in³ AND consistent with the agent's own analytic estimate (≤1%); flank angle pinned, so host results should agree ≤0.5% |
| 8 | Sheets | four-view + axis section rendered; hub collars, keyway, set screw visible |
| 9 | No silent workarounds | failures quoted against the docs |

Reference points (examiner only, from the 2026-08-10 generator session —
OFF LIMITS to benchmark agents): D35C13SS volume dev vs analytic 0.18%,
strand-spacing check err 1.1e-16.

Source rule: skill docs, recipes and the data contract are fair game;
`workspace/training/` and `workspace/output/` are off limits.
