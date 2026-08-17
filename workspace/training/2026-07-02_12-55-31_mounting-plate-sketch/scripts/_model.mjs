// Parametric model of the mounting-plate drawing. model(P) computes every tangency
// analytically, so the SAME code path yields the rough seed (perturbed params) and the exact
// verification targets (drawing params). All 2D [x, y]. Datum: hub center H = (0, 0).
//
// Interpretation (settled with ph): boss centers on an R98 construction circle about the hub
// center, 30° each side of vertical; R100 = outer blend arcs tangent to the Ø60 hub circle
// AND the Ø40 bosses (both inside: |C−H| = RF−RHUB, |C−B| = RF−RBOSS); R33 notch tangent to
// both bosses, center on the vertical CL; arms = straight edges tangent to the hub circle and
// to a Ø6 width-gauge construction circle at the boss center, R3 fillets into the bosses.
//
// Params (drawing values):
//   RF   R100 outer blend radius            RP   R98 boss-placement radius
//   TH   30  boss axis angle from vertical (deg)
//   RHUB Ø60→30   RBORE Ø22→11   RBC Ø42→21   RB6 Ø6→3 (bolt holes, 6 отв.)
//   RBOSS Ø40→20  RH Ø20→10 (2 отв.)         RN  R33 notch
//   RG   arm width 6 → Ø6 gauge → 3          R3  arm→boss fillet

export const EXACT = { RF: 100, RP: 98, TH: 30, RHUB: 30, RBORE: 11, RBC: 21, RB6: 3, RBOSS: 20, RH: 10, RN: 33, RG: 3, R3: 3 }
export const ROUGH = { RF: 94, RP: 93, TH: 27.5, RHUB: 28, RBORE: 10.2, RBC: 19.7, RB6: 2.75, RBOSS: 18.6, RH: 9.2, RN: 30.5, RG: 2.7, R3: 2.65 }

const mx = p => [-p[0], p[1]]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const scl = (a, s) => [a[0] * s, a[1] * s]
const len = a => Math.hypot(a[0], a[1])
const unit = a => scl(a, 1 / len(a))
const cross = (a, b) => a[0] * b[1] - a[1] * b[0]

/** Intersection of circles (c1,r1),(c2,r2) — returns the two points. */
function circleXcircle(c1, r1, c2, r2) {
  const d = len(sub(c2, c1))
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
  const h = Math.sqrt(r1 * r1 - a * a)
  const m = add(c1, scl(unit(sub(c2, c1)), a))
  const p = scl([-(c2[1] - c1[1]) / d, (c2[0] - c1[0]) / d], h)
  return [add(m, p), sub(m, p)]
}

/** cw flag for an arc s→e about c (all arcs in this model sweep < 180°). */
const cwOf = (s, e, c) => cross(sub(s, c), sub(e, c)) < 0

export function model(P) {
  const { RF, RP, TH, RHUB, RBORE, RBC, RB6, RBOSS, RH, RN, RG, R3 } = P
  const th = (TH * Math.PI) / 180
  const H = [0, 0]
  const B = [RP * Math.sin(th), -RP * Math.cos(th)] // right boss center

  // R100 blend (right): |C−H| = RF−RHUB, |C−B| = RF−RBOSS; valid branch has hub tangency x>0
  const CB = circleXcircle(H, RF - RHUB, B, RF - RBOSS)
    .find(c => add(H, scl(unit(sub(H, c)), RHUB))[0] > 0)
  const blendS = add(H, scl(unit(sub(H, CB)), RHUB)) // tangency on hub circle
  const blendE = add(B, scl(unit(sub(B, CB)), RBOSS)) // tangency on boss circle

  // R33 notch: center on x=0, tangent to both bosses (distance RN+RBOSS), above boss level
  const C33 = [0, B[1] + Math.sqrt((RN + RBOSS) ** 2 - B[0] * B[0])]
  const notchS = add(B, scl(unit(sub(C33, B)), RBOSS)) // tangency on right boss

  // Arm edges: common external tangents of circle(H, RHUB) and gauge circle(B, RG).
  // Line normal n satisfies n·(B−H) = RG − RHUB; two sign branches = outer/inner edge.
  const u = unit(B)
  const uP = [-u[1], u[0]]
  const ca = (RG - RHUB) / RP
  const sa = Math.sqrt(1 - ca * ca)
  const edge = sgn => {
    const n = add(scl(u, ca), scl(uP, sgn * sa))
    const hubT = sub(H, scl(n, RHUB)) // tangency on hub circle (n·H − c = RHUB, c = −RHUB)
    let dir = [-n[1], n[0]]
    if (dir[0] * u[0] + dir[1] * u[1] < 0) dir = scl(dir, -1) // point hub → boss
    // R3 fillet: distance R3 from the edge line (boss side), RBOSS+R3 from B, upstream branch
    const F = add(add(B, scl(n, R3 - RG)), scl(dir, -Math.sqrt((RBOSS + R3) ** 2 - (R3 - RG) ** 2)))
    const fS = sub(F, scl(n, R3)) // fillet↔edge tangency (edge segment ends here)
    const fE = add(B, scl(unit(sub(F, B)), RBOSS)) // fillet↔boss tangency
    return { n, hubT, F, fS, fE }
  }
  const eO = edge(-1) // outer (away from the vertical CL)
  const eI = edge(+1) // inner

  const arc = (s, e, c) => ({ s, e, c, cw: cwOf(s, e, c) })
  const marc = a => ({ s: mx(a.e), e: mx(a.s), c: mx(a.c), cw: a.cw }) // mirror + s/e swap keeps cw
  // mirror WITHOUT s/e swap (flips cw) — for arcs whose start must keep its role (the
  // fillet wiring is uniform: edge.end ↔ fillet.START, fillet.END on boss — on both sides)
  const marcK = a => ({ s: mx(a.s), e: mx(a.e), c: mx(a.c), cw: !a.cw })

  const M = {
    P,
    B,
    // construction datum — EXACT in every model (placed exactly, then fixed)
    clv: { a: [0, -130], b: [0, 40] },
    clh: { a: [-40, 0], b: [40, 0] },
    // construction: boss axes (drawn 30° diagonals), placement + gauge circles, bolt circle
    axisR: { a: H, b: B },
    axisL: { a: H, b: mx(B) },
    bc42: { c: H, r: RBC },
    r98: { c: H, r: RP },
    gaugeR: { c: B, r: RG },
    gaugeL: { c: mx(B), r: RG },
    // hub stack + bolt hole (full circles)
    hub: { c: H, r: RHUB },
    bore: { c: H, r: RBORE },
    hole6: { c: [0, RBC], r: RB6 }, // 12-o'clock hole; 5 more via circularPattern
    // bosses + holes (full circles)
    bossR: { c: B, r: RBOSS },
    bossL: { c: mx(B), r: RBOSS },
    holeR: { c: B, r: RH },
    holeL: { c: mx(B), r: RH },
    // outer blend arcs + notch
    blendR: arc(blendS, blendE, CB),
    notch: arc(notchS, mx(notchS), C33),
    // right arm: edges (hub tangency → fillet start) + R3 fillets (edge → boss)
    edgeRO: { a: eO.hubT, b: eO.fS },
    edgeRI: { a: eI.hubT, b: eI.fS },
    f3RO: arc(eO.fS, eO.fE, eO.F),
    f3RI: arc(eI.fS, eI.fE, eI.F),
    // left arm mirrors
    edgeLO: { a: mx(eO.hubT), b: mx(eO.fS) },
    edgeLI: { a: mx(eI.hubT), b: mx(eI.fS) },
  }
  M.blendL = marc(M.blendR) // side-aware wiring in _build (start on bossL, end on hub)
  M.f3LO = marcK(M.f3RO)
  M.f3LI = marcK(M.f3RI)
  // bolt-hole pattern targets (verification only — copies come from circularPattern)
  M.boltHoles = [0, 1, 2, 3, 4, 5].map(k => {
    const a = Math.PI / 2 - (k * Math.PI) / 3
    return [RBC * Math.cos(a), RBC * Math.sin(a)]
  })
  return M
}

export const CONSTR_LINE_KEYS = ['clv', 'clh', 'axisR', 'axisL']
export const REAL_LINE_KEYS = ['edgeRO', 'edgeRI', 'edgeLO', 'edgeLI']
export const LINE_KEYS = [...CONSTR_LINE_KEYS, ...REAL_LINE_KEYS]
export const CONSTR_CIRCLE_KEYS = ['bc42', 'r98', 'gaugeR', 'gaugeL']
export const REAL_CIRCLE_KEYS = ['hub', 'bore', 'hole6', 'bossR', 'bossL', 'holeR', 'holeL']
export const CIRCLE_KEYS = [...CONSTR_CIRCLE_KEYS, ...REAL_CIRCLE_KEYS]
export const ARC_KEYS = ['blendR', 'blendL', 'notch', 'f3RO', 'f3RI', 'f3LO', 'f3LI']
// keys with exact verification targets (axes' endpoints follow H/B; datum lines are fixed)
export const VERIFY_KEYS = [...ARC_KEYS, ...REAL_LINE_KEYS, ...CIRCLE_KEYS, 'axisR', 'axisL']
