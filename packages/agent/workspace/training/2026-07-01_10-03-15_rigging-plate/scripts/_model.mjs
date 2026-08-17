// _model.mjs — rigging-plate coordinate model (inches, y-up, origin lower-left).
// Radii come straight from the drawing's Ø/R annotations. Centers are tuned by snapshot iteration.
//
// Body = union of ADDITIVE shapes (bosses + lobes, drawn so they overlap into one connected blob).
// Carved by SUBTRACTIVE shapes: interior holes + concave waist fillet disks.
// region(P) = additive(P) && !hole(P) && !fillet(P)   → classifyByRegion extracts the whole wire.

export const M = {
  centerBoss: { c: [2.95, 0.95], rBoss: 0.875, rHole: 0.5625 }, // Ø1.750 / Ø1.125  (datum)
  // top boss: .750 HORIZONTAL left of the center boss, raised so the two boss circles keep a CLEAR gap
  // (center distance 1.81 > r1+r2 1.6875) — they are joined by a web, not overlapping.
  topBoss:    { c: [2.20, 2.60], rBoss: 0.8125, rHole: 0.375 }, // Ø1.625 / Ø.750
  // web/neck bridging the raised top boss down to the center boss (the material the bosses hang off)
  web:        { r: 0.55 },
  // left end: horizontal stadium, height 1.875 (r 0.9375). right end pulled back to clear the center hole.
  leftEnd:    { a: [0.94, 0.95], b: [1.45, 0.95], r: 0.9375 },
  // left slot HOLE: obround, ends 1.000 apart, r 0.437
  slot:       { a: [0.65, 0.95], b: [1.65, 0.95], r: 0.437 },
  // right lobe: obround body on a 40° axis, r 0.875 ends
  rightLobe:  { far: [4.95, 1.55], near: [4.05, 0.80], r: 0.875 },
}

// concave waist fillet radii (centers derived from external tangency to the two neighbour bosses)
export const FILLET = { topWaist: 1.750, botWaist: 1.375, rightUpper: 0.625, rightLower: 0.438 }

// ---- additive body shapes (their union = the connected plate blob) ----
export function bodyShapes(m = M) {
  return [
    { kind: 'circle', c: m.centerBoss.c, r: m.centerBoss.rBoss },
    { kind: 'circle', c: m.topBoss.c, r: m.topBoss.rBoss },
    { kind: 'capsule', a: m.topBoss.c, b: m.centerBoss.c, r: m.web.r }, // web bridging top boss → center boss
    { kind: 'capsule', a: m.leftEnd.a, b: m.leftEnd.b, r: m.leftEnd.r },
    { kind: 'capsule', a: m.rightLobe.near, b: m.rightLobe.far, r: m.rightLobe.r },
  ]
}

// ---- interior holes (subtract) ----
export function holeShapes(m = M) {
  return [
    { kind: 'circle', c: m.centerBoss.c, r: m.centerBoss.rHole },
    { kind: 'circle', c: m.topBoss.c, r: m.topBoss.rHole },
    { kind: 'capsule', a: m.slot.a, b: m.slot.b, r: m.slot.r },
  ]
}

// concave waist fillet disks (subtractive). Centers from external tangency to their two neighbour bosses.
export function filletDisks(m = M) {
  const tw = filletCenter(m.topBoss.c, m.topBoss.rBoss, m.rightLobe.far, m.rightLobe.r, FILLET.topWaist, +1)
  const bw = filletCenter(m.leftEnd.b, m.leftEnd.r, m.centerBoss.c, m.centerBoss.rBoss, FILLET.botWaist, -1)
  return [
    { c: tw, r: FILLET.topWaist, tag: 'topWaist' },
    { c: bw, r: FILLET.botWaist, tag: 'botWaist' },
  ].filter(f => f.c)
}
export const filletShapes = (m = M) => filletDisks(m).map(f => ({ kind: 'circle', c: f.c, r: f.r }))

// external-tangency fillet center: |F-C1| = R+r1, |F-C2| = R+r2. sign picks the notch side (+1 above / -1 below).
export function filletCenter(C1, r1, C2, r2, R, sign = 1) {
  const d1 = R + r1, d2 = R + r2
  const dx = C2[0] - C1[0], dy = C2[1] - C1[1], d = Math.hypot(dx, dy)
  const a = (d1 * d1 - d2 * d2 + d * d) / (2 * d)      // along C1->C2
  const h2 = d1 * d1 - a * a
  if (h2 < 0) return null                               // no tangent disk of this radius
  const h = Math.sqrt(h2)
  const ux = dx / d, uy = dy / d                        // unit C1->C2
  const px = -uy, py = ux                               // left normal
  return [C1[0] + a * ux + sign * h * px, C1[1] + a * uy + sign * h * py]
}
