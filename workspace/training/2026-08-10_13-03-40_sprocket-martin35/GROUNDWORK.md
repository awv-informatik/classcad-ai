# Groundwork — ANSI #35 Roller-Chain Sprocket (Martin catalog-faithful)

**Date:** 2026-08-10
**Task:** Verify the ChatGPT recipe + the Onshape-style custom-feature header (image), then build a parametrized sprocket generator in ClassCAD.

## Sources (verified, not from memory)

1. **Martin Sprocket Engineering Data** (E-152..E-161), fetched from martinsprocket.com — chain dims, tooth dims, max hub/bore, keyways/set screws, PD/OD formulas.
2. **GEARS-IDS "Designing and Drawing a Sprocket"** (gearseds.com, ACA "Chains for Power Transmission and Material Handling" handbook equations) — the full ANSI tooth-form construction with a worked #25 30T example.
3. **ChatGPT share 6a7994c2** — read in full via browser (JS-rendered page).

## 1. The ChatGPT conversation — assessment

The conversation is a *prompt-engineering* exercise: user asks for a parametric sprocket CAD prompt (Method 1: single tooth-space cut + circular pattern), questions whether step 4 is sufficient for a fully-constrained sketch, and gets a consolidated prompt.

**Correct:**
- `PitchRadius = ChainPitch / (2·sin(π/ToothCount))` ✓ (equivalent to Martin's `PD = P / sin(180°/N)`)
- Method-1 workflow structure (blank → one tooth-space → cut → circular pattern → bore → hub → chamfer/fillet) is standard practice.
- Its own caveat is accurate and important: *"not sufficient to guarantee an ANSI/ISO-compliant tooth profile unless the exact standard equations … are also specified. 'Tangent arcs and appropriate clearance' still leaves multiple valid geometries."*

**Simplified / not catalog-accurate:**
- `RollerSeatRadius = RollerDiameter/2 + RollerClearance` — the standard is `R = 0.5025·Dr + 0.0015 in` (clearance is *defined*, not a free parameter).
- No flank equations at all (no seating angle, no working curve, no topping curve). The tooth profile is left underdetermined — exactly the gap the attached image's feature fills with "ASME B29.1 Type II" arcs.
- "RimThickness", "ToothTipRadius", "ToothFlank geometry" are named but never defined.

**Conclusion:** use the ChatGPT recipe as the *workflow skeleton*, and the ACA/ASME equations + Martin catalog data as the *geometry authority*.

## 2. Tooth form — ACA / ANSI B29.1 equations (verified)

P = pitch, N = teeth, Dr = nominal roller diameter (for #35, a rollerless bushing chain, Dr = bushing OD = 0.200").

| Symbol | Formula | 30T #25 check (doc) |
|---|---|---|
| PD | P / sin(180°/N) | 2.3917 ✓ |
| R (seating) | 0.5025·Dr + 0.0015 | .0668 ✓ |
| A | 35° + 60°/N | 37.0° ✓ |
| B | 18° − 56°/N | 16.1333° ✓ |
| ac | 0.8·Dr | — |
| M | ac·cos A | .0831 ✓ |
| T | ac·sin A | .0626 ✓ |
| E | 1.3025·Dr + 0.0015 | .1708 ✓ |
| W | 1.4·Dr·cos(180°/N) | .1810 ✓ |
| V | 1.4·Dr·sin(180°/N) | .0190 ✓ |
| F | Dr·[0.8·cos B + 1.4·cos(17°−64°/N) − 1.3025] − 0.0015 | .1050 ✓ |

**Geometric construction** (frame: roller/seat center `a` on the pitch circle, tooth-space centerline = radial line through `a`; building the LEFT flank):

- Seating (root) arc: center `a`, radius R. Point `x = a − R·(cos A, sin A)`.
- Working-curve center `c = a + (M, T)` — on the OPPOSITE side of the centerline. Key identity: `E = ac + R` exactly (1.3025 = 0.8 + 0.5025), so the working arc centered at `c` with radius E passes through `x` **exactly tangent** to the seating arc (internal tangency, center distance = E − R).
- Working arc: from `x` (at angle 180°+A from c) sweeping **toward the pitch line by B** to `y = c − E·(cos(A−B), sin(A−B))`.
- Topping-curve center `b = a − (W, V)`, radius F, from `y` out to the tooth tip.
- Tooth tip = intersection of circle(b, F) with the ray from sprocket center at 180°/N from the space centerline (= the adjacent tooth's centerline).

**Discrepancy found (real, inherent to the published standard):** F by formula ≠ |b−y| — e.g. 30T #25: F=.10499 vs |b−y|=.10648 (+1.4%); 21T #35: .16404 vs .16595. The gearseds doc acknowledges this: *"It may be necessary to force a tangent relationship in the event that rounding errors prevent that."* → **Decision: use F_eff = |b−y|** so the profile is watertight at `y`; joint tangency error ≲1°, tip lands marginally outward. Documented deviation, not a bug.

## 3. Martin catalog data — ANSI #35 (3/8" pitch)

From E-156/E-157 (exact catalog values):

- Chain: pitch .375, roller (bushing) dia **.200**, roller width 3/16, link-plate height **.356**, tensile 2100 lb.
- Tooth thickness single strand **t1 = THR = .168** (= 0.93·W − 0.006 ✓), double/triple **t2 = .162**, strand spacing **K = .399**.
  Consistency: M2 = K + t2 = **.561** ✓ catalog; M3 = 2K + t2 = **.960** ✓ catalog. Chain-plate clearance gap between strands = K − t2 = **.237**.
- `PD = P/sin(180/N)`; catalog `OD = P·(0.6 + cot(180/N))` (pointed-tooth max OD).
- Max hub / max bore (No. 35, E-158) — see `_model.mjs` MARTIN35_HUB table (rows 8–45 read from the catalog page; a few 64ths flagged LOW-CONFIDENCE from OCR: 19T hub, 21/22T hub, 31T bore). Sanity fit: MaxHub ≈ PD − (.42….45) — consistent with PD − linkPlateHeight(.356) − chain-plate clearance.
- Keyways & set screws (E-156 std table, = ASME B17.1 square keys): shaft 1/2–9/16 → 1/8×1/16 kw, #10-24 screw; 5/8–7/8 → 3/16×3/32, 1/4; 15/16–1¼ → 1/4×1/8, 5/16; 1 5/16–1 3/8 → 5/16×5/32, 5/16; 1 7/16–1¾ → 3/8×3/16, 3/8; 1 13/16–2¼ → 1/2×1/4, 1/2. (No. 35 hub page adds shaft 7/16 → 3/32×3/64, 3/16.)
- Hub styles (E-152): A = flat plate no hub, B = hub one side, C = hub both sides. Multi-strand prefix D/E(T) (E-153). SS suffix = stainless (E-154). Martin conforms to **B29.1-1975 Type II tooth form** (E-154) — matches the image's claim.

## 4. The image recipe — cross-check

| Image claim | Verdict |
|---|---|
| ANSI #35 = 3/8" pitch, tooth form ASME B29.1 Type II (seating+working+topping) | ✓ standard, equations above |
| Blank OD = PD + P/2 → tip flat | Design choice, slightly ≠ ANSI max OD = P(0.6+cot(180/N)). PD+P/2 < maxOD ⇔ tan(90°/N) < 0.1 ⇔ **N ≥ 16**. For N ≤ 15 the teeth come to the ANSI point *below* the blank OD (no flat) — generator handles both regimes. |
| Tip taper P/2 radial × P/8 lateral per side | Plausible catalog-style taper; implemented as revolved cone-ring cuts. Tip thickness = t − P/4 (= .074 single strand) — thin but positive ✓ |
| Catalog tooth thickness + clearance gaps between strands | ✓ t1/t2/K above |
| 10..45T Martin std hub & bore lookups + custom mode | ✓ table embedded (with OCR-uncertainty flags) |
| Hub styles A/B/C | ✓ Martin E-152 |
| Bore + optional chamfer, auto ASME B17.1 square keyway, 1–2 set screws auto-sized | ✓ tables above |
| Mate connector at bore axis | ClassCAD equivalent: `part.workCSys` at bore center, z along axis |
| Names body with catalog number + Stainless Steel | `part.create name` + `setAppearance` (ClassCAD has no material system) |
| Catalog math in inches × `inch` | Same here: model math in inches, ×25.4 at the API boundary |

## 5. ClassCAD adaptation notes

- ChatGPT's "Extrude-Cut + pattern the cut" → ClassCAD has no cut-extrude: build the **tool** body, `circularPattern` the tool (count=N), then ONE `part.boolean SUBTRACTION` with all tools (pattern + originals). Booleans consume features → single mega-subtraction keeps the chain simple.
- Tooth-space cut region: seating arc + 2 working arcs + 2 topping arcs, extended past the blank OD (or past the ANSI tip for N≤15, with +0.2° overlap so adjacent cuts remove the above-tip annulus), closed by a cap arc at Ro + 0.3P.
- `part.cylinder` for the bore (workCSys rotated z→axis), sketch-rectangle extrusion for the keyway, sketch-circle extrusions on perpendicular planes for radial set screws, `part.chamfer` (post-recalc, `arcs` position lookup) for the bore chamfer.
