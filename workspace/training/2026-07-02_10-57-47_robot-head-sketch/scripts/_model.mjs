// Parametric model of the robot-head drawing. model(P) computes every junction analytically,
// so the SAME code path yields the rough seed (perturbed params → solver has real work to do)
// and the exact verification targets (drawing params). All 2D [x, y].
//
// v2 per ph review: the Ø5.6 eye circles are FULL circles (like the Ø2.8 holes) — the dome
// and R2 fillets are tangent to them with endpoints ON the circles; the profile does not
// consume the circles into arcs. bossRArc/bossLArc remain as VIRTUAL entries (not created
// as geometry) for the analytic-area computation and readback targets.
//
// Params:
//   E   boss center offset from vertical centerline      (drawing: 6)
//   RB  eye/boss circle radius                           (drawing: Ø5.6 → 2.8)
//   RH  hole radius                                      (drawing: Ø2.8 → 1.4)
//   RD  dome radius, internally tangent to eye circles   (drawing: R12)
//   YB  bottom edge y                                    (drawing: 8 below eye centers → −8)
//   XC  chin half-width                                  (drawing: 3.5)
//   R2  eye↔side concave fillet radius                   (drawing: 2×R2)
//   R1  bottom corner fillet radius                      (drawing: 2×R1)
//   SW  slot half-width                                  (drawing: 3 wide → 1.5)
//   SB  slot bottom edge y                               (drawing: 2 above bottom → −6)
//   RS  slot corner radius                               (drawing: 4×R1)
//   STC slot top-corner-center y (ON horizontal centerline in the drawing → 0)

export const EXACT = { E: 6, RB: 2.8, RH: 1.4, RD: 12, YB: -8, XC: 3.5, R2: 2, R1: 1, SW: 1.5, SB: -6, RS: 1, STC: 0 }
export const ROUGH = { E: 5.7, RB: 2.6, RH: 1.3, RD: 11.2, YB: -7.6, XC: 3.3, R2: 1.8, R1: 0.8, SW: 1.35, SB: -5.7, RS: 0.9, STC: -0.2 }

const mx = p => [-p[0], p[1]] // mirror about the vertical centerline

export function model(P) {
  const { E, RB, RH, RD, YB, XC, R2, R1, SW, SB, RS, STC } = P

  // Dome internally tangent to both eye circles: center distance = RD − RB, center on x=0.
  const yD = -Math.sqrt((RD - RB) ** 2 - E * E)
  const u = [E / (RD - RB), -yD / (RD - RB)] // unit vector dome center → right eye center
  const tDomeR = [RD * u[0], yD + RD * u[1]] // dome↔eye tangent point (right)

  // R2 concave fillet: tangent to side line x=XC (center 2 right of it) + externally to eye circle.
  const xF2 = XC + R2
  const yF = -Math.sqrt((RB + R2) ** 2 - (xF2 - E) ** 2)
  const tSideR = [XC, yF] // fillet↔side tangent
  const k = RB / (RB + R2)
  const tBossR = [E + k * (xF2 - E), k * yF] // fillet↔eye tangent

  // R1 bottom corner fillet
  const f1cR = [XC - R1, YB + R1]

  const M = {
    P,
    // construction datum — EXACT in every model (the anchor is placed exactly, then fixed)
    clh: { a: [-10, 0], b: [10, 0] },
    clv: { a: [0, -9], b: [0, 6] },
    // chin chain, CCW from bottom line (open at the two f2 tops — they land on the eye circles)
    bottom: { a: [-(XC - R1), YB], b: [XC - R1, YB] },
    f1R: { s: [XC - R1, YB], e: [XC, YB + R1], c: f1cR, cw: false },
    sideR: { a: [XC, YB + R1], b: tSideR },
    f2R: { s: tSideR, e: tBossR, c: [xF2, yF], cw: true }, // concave → CW in CCW traversal
    dome: { s: tDomeR, e: mx(tDomeR), c: [0, yD], cw: false },
    f2L: { s: mx(tBossR), e: mx(tSideR), c: [-xF2, yF], cw: true },
    sideL: { a: mx(tSideR), b: [-XC, YB + R1] },
    f1L: { s: [-XC, YB + R1], e: [-(XC - R1), YB], c: [-(XC - R1), YB + R1], cw: false },
    // eyes: FULL circles (per drawing), holes concentric
    bossR: { c: [E, 0], r: RB },
    bossL: { c: [-E, 0], r: RB },
    holeR: { c: [E, 0], r: RH },
    holeL: { c: [-E, 0], r: RH },
    // VIRTUAL eye-rim arcs (dome tangent → fillet tangent, outward) — area/verification only
    bossRArc: { s: tBossR, e: tDomeR, c: [E, 0], cw: false, virtual: true },
    bossLArc: { s: mx(tDomeR), e: mx(tBossR), c: [-E, 0], cw: false, virtual: true },
    // slot loop, CCW from top-right corner arc
    slotTR: { s: [SW, STC], e: [SW - RS, STC + RS], c: [SW - RS, STC], cw: false },
    slotTop: { a: [SW - RS, STC + RS], b: [-(SW - RS), STC + RS] },
    slotTL: { s: [-(SW - RS), STC + RS], e: [-SW, STC], c: [-(SW - RS), STC], cw: false },
    slotLeft: { a: [-SW, STC], b: [-SW, SB + RS] },
    slotBL: { s: [-SW, SB + RS], e: [-(SW - RS), SB], c: [-(SW - RS), SB + RS], cw: false },
    slotBottom: { a: [-(SW - RS), SB], b: [SW - RS, SB] },
    slotBR: { s: [SW - RS, SB], e: [SW, SB + RS], c: [SW - RS, SB + RS], cw: false },
    slotRight: { a: [SW, SB + RS], b: [SW, STC] },
    // slot center mark (drawing crosshair) — a sketch point at the slot's rectangle center
    slotCenter: { p: [0, (SB + STC + RS) / 2] },
  }
  return M
}

export const LINE_KEYS = ['clh', 'clv', 'bottom', 'sideR', 'sideL', 'slotTop', 'slotLeft', 'slotBottom', 'slotRight']
export const ARC_KEYS = ['f1R', 'f2R', 'dome', 'f2L', 'f1L', 'slotTR', 'slotTL', 'slotBL', 'slotBR']
export const CIRCLE_KEYS = ['bossR', 'bossL', 'holeR', 'holeL']
export const SLOT_KEYS = ['slotTR', 'slotTop', 'slotTL', 'slotLeft', 'slotBL', 'slotBottom', 'slotBR', 'slotRight']
// outer boundary for area math (uses the virtual eye-rim arcs)
export const AREA_OUTER_KEYS = ['bottom', 'f1R', 'sideR', 'f2R', 'bossRArc', 'dome', 'bossLArc', 'f2L', 'sideL', 'f1L']
// real curves to feed a region op (no construction lines, no center-mark point)
export const PROFILE_KEYS = ['bottom', 'f1R', 'sideR', 'f2R', 'dome', 'f2L', 'sideL', 'f1L',
  'bossR', 'bossL', 'holeR', 'holeL', ...SLOT_KEYS]

/** Signed area of a closed loop of ordered segments (chords via shoelace + circular-segment
 *  corrections). Positive for CCW traversal. Used for the analytic volume cross-check. */
export function loopArea(M, keys) {
  let area = 0
  for (const k of keys) {
    const g = M[k]
    const [p, q] = g.c ? [g.s, g.e] : [g.a, g.b]
    area += (p[0] * q[1] - q[0] * p[1]) / 2 // shoelace chord term
    if (g.c) {
      const R = Math.hypot(g.s[0] - g.c[0], g.s[1] - g.c[1])
      const a0 = Math.atan2(g.s[1] - g.c[1], g.s[0] - g.c[0])
      const a1 = Math.atan2(g.e[1] - g.c[1], g.e[0] - g.c[0])
      let sweep = g.cw ? a0 - a1 : a1 - a0 // positive sweep magnitude
      while (sweep < 0) sweep += 2 * Math.PI
      const seg = (R * R / 2) * (sweep - Math.sin(sweep)) // area between chord and arc
      area += g.cw ? -seg : seg
    }
  }
  return area
}
