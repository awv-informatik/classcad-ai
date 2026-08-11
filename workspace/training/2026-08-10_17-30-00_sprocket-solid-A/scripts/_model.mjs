/**
 * _model.mjs — pure math for the Martin 35 SS sprocket generator.
 * ALL VALUES IN INCHES (multiply by `inch` = 25.4 at the API boundary).
 * Sources: ACA/ANSI B29.1 tooth form (verified vs gearseds worked example),
 * Martin Sprocket Engineering Data E-152..E-158. See ../GROUNDWORK.md.
 */

export const inch = 25.4

const d2r = (d) => (d * Math.PI) / 180
const hyp = Math.hypot

// ---------------------------------------------------------------- catalog data

export const CHAIN_35 = {
  pitch: 0.375,
  rollerDia: 0.2, // bushing OD — #35 is rollerless
  rollerWidth: 0.1875,
  linkPlateHeight: 0.356,
  t1: 0.168, // single-strand tooth thickness (catalog THR)
  t2: 0.162, // multi-strand tooth thickness
  K: 0.399, // transverse strand spacing
}

// Martin No.35 recommended max hub & bore (E-158). f = fraction string parsed below.
// conf:'low' = OCR of the catalog page was ambiguous for that 64th.
const F = (s) => {
  const m = s.trim().match(/^(?:(\d+)\s+)?(\d+)\/(\d+)$|^(\d+)$/)
  if (!m) throw new Error(`bad fraction ${s}`)
  if (m[4]) return Number(m[4])
  return (m[1] ? Number(m[1]) : 0) + Number(m[2]) / Number(m[3])
}
export const MARTIN35_HUB = {
  8: { maxHub: F('1/2'), maxBore: F('1/4') },
  9: { maxHub: F('5/8'), maxBore: F('3/8') },
  10: { maxHub: F('3/4'), maxBore: F('1/2') },
  11: { maxHub: F('55/64'), maxBore: F('9/16') },
  12: { maxHub: F('63/64'), maxBore: F('9/16') },
  13: { maxHub: F('1 7/64'), maxBore: F('11/16') },
  14: { maxHub: F('1 15/64'), maxBore: F('3/4') },
  15: { maxHub: F('1 23/64'), maxBore: F('7/8') },
  16: { maxHub: F('1 15/32'), maxBore: F('15/16') },
  17: { maxHub: F('1 19/32'), maxBore: F('1 1/16') },
  18: { maxHub: F('1 23/32'), maxBore: F('1 1/8') },
  19: { maxHub: F('1 27/32'), maxBore: F('1 1/4'), conf: 'low' },
  20: { maxHub: F('1 61/64'), maxBore: F('1 1/4') },
  21: { maxHub: F('2 5/64'), maxBore: F('1 5/16'), conf: 'low' },
  22: { maxHub: F('2 13/64'), maxBore: F('1 7/16'), conf: 'low' },
  23: { maxHub: F('2 5/16'), maxBore: F('1 9/16') },
  24: { maxHub: F('2 7/16'), maxBore: F('1 11/16') },
  25: { maxHub: F('2 9/16'), maxBore: F('1 3/4') },
  26: { maxHub: F('2 43/64'), maxBore: F('1 3/4') },
  27: { maxHub: F('2 51/64'), maxBore: F('1 7/8') },
  28: { maxHub: F('2 59/64'), maxBore: F('1 7/8') },
  29: { maxHub: F('3 1/32'), maxBore: F('2') },
  30: { maxHub: F('3 5/32'), maxBore: F('2 1/8') },
  31: { maxHub: F('3 9/32'), maxBore: F('2 1/8'), conf: 'low' },
  32: { maxHub: F('3 25/64'), maxBore: F('2 1/4') },
  35: { maxHub: F('3 3/4'), maxBore: F('2 1/2') },
  40: { maxHub: F('4 23/64'), maxBore: F('2 13/16') },
  45: { maxHub: F('4 61/64'), maxBore: F('3 1/4') },
}
// interpolation fallback for tooth counts not in the table (fit: maxHub ≈ PD − 0.44)
export function maxHubFor(N, P = CHAIN_35.pitch) {
  if (MARTIN35_HUB[N]) return MARTIN35_HUB[N].maxHub
  const PD = P / Math.sin(Math.PI / N)
  return PD - 0.44
}

// Std keyways & set screws by shaft(bore) dia — Martin E-156 + No.35 page 7/16 row.
// [minBore, maxBore, keyWidth, keyDepth, setScrewDia]
const KEY_TABLE = [
  [7 / 16, 7 / 16 + 1e-9, 3 / 32, 3 / 64, 0.19], // #10
  [1 / 2, 9 / 16, 1 / 8, 1 / 16, 0.19], // 10-24
  [5 / 8, 7 / 8, 3 / 16, 3 / 32, 0.25],
  [15 / 16, 1.25, 1 / 4, 1 / 8, 5 / 16],
  [1 + 5 / 16, 1 + 3 / 8, 5 / 16, 5 / 32, 5 / 16],
  [1 + 7 / 16, 1.75, 3 / 8, 3 / 16, 3 / 8],
  [1 + 13 / 16, 2.25, 1 / 2, 1 / 4, 1 / 2],
  [2 + 5 / 16, 2.75, 5 / 8, 5 / 16, 5 / 8],
  [2 + 13 / 16, 3.25, 3 / 4, 3 / 8, 3 / 4],
]
export function keywayFor(bore) {
  for (const [lo, hi, w, d, s] of KEY_TABLE)
    if (bore >= lo - 1e-9 && bore <= hi + 1e-9) return { keyWidth: w, keyDepth: d, screwDia: s }
  return null // bore too small/large for a std keyway
}

// ------------------------------------------------------------- tooth-form math

const v2 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
  scale: (a, s) => [a[0] * s, a[1] * s],
  len: (a) => hyp(a[0], a[1]),
  unit: (a) => v2.scale(a, 1 / v2.len(a)),
  dot: (a, b) => a[0] * b[0] + a[1] * b[1],
  rot: (a, t) => [a[0] * Math.cos(t) - a[1] * Math.sin(t), a[0] * Math.sin(t) + a[1] * Math.cos(t)],
  ang: (a) => Math.atan2(a[1], a[0]),
}

/**
 * ACA/ANSI B29.1 tooth-space profile, sprocket center at origin,
 * space centerline along +y. Returns entity chain + derived data (inches).
 */
export function toothForm({ P, Dr, N, blankOD }) {
  const p = Math.PI / N
  const Rp = P / (2 * Math.sin(p))
  const R = 0.5025 * Dr + 0.0015
  const A = d2r(35 + 60 / N)
  const B = d2r(18 - 56 / N)
  const M = 0.8 * Dr * Math.cos(A)
  const T = 0.8 * Dr * Math.sin(A)
  const E = 1.3025 * Dr + 0.0015 // = 0.8*Dr + R exactly → tangent at x
  const W = 1.4 * Dr * Math.cos(p)
  const V = 1.4 * Dr * Math.sin(p)
  const Ro = blankOD / 2
  const Rcap = Ro + 0.3 * P

  const a = [0, Rp]
  // left flank construction
  const c = v2.add(a, [M, T])
  const x = v2.add(a, [-R * Math.cos(A), -R * Math.sin(A)])
  const y = v2.sub(c, [E * Math.cos(A - B), E * Math.sin(A - B)])
  const b = v2.sub(a, [W, V])
  const Feff = v2.len(v2.sub(y, b))
  const Fstd = Dr * (0.8 * Math.cos(B) + 1.4 * Math.cos(d2r(17 - 64 / N)) - 1.3025) - 0.0015

  // tooth tip: circle(b,Feff) ∩ ray from origin at angle 90°+p (left tooth centerline)
  const u = [-Math.sin(p), Math.cos(p)]
  const ub = v2.dot(u, b)
  const disc = ub * ub - v2.dot(b, b) + Feff * Feff
  if (disc < 0) throw new Error('tooth tip: no ray intersection')
  const tipR = ub + Math.sqrt(disc)
  const tip = v2.scale(u, tipR)
  const flatTip = tipR > Ro // blank OD truncates the tooth → tip flat

  // topping end point: blank OD circle if flat, else the ANSI pointed tip
  let end
  if (flatTip) {
    // circle(origin, Ro) ∩ circle(b, Feff) — pick the candidate between y and tip (CCW from y around b)
    const d = v2.len(b)
    const x0 = (d * d + Ro * Ro - Feff * Feff) / (2 * d)
    const h2 = Ro * Ro - x0 * x0
    if (h2 < 0) throw new Error('topping/OD: no intersection')
    const base = v2.unit(b)
    const perp = [-base[1], base[0]]
    const cands = [1, -1].map((s) =>
      v2.add(v2.scale(base, x0), v2.scale(perp, s * Math.sqrt(h2))),
    )
    const a0 = v2.ang(v2.sub(y, b))
    const sweepTo = (pt) => {
      let s = v2.ang(v2.sub(pt, b)) - a0
      while (s < 0) s += 2 * Math.PI
      return s
    }
    const tipSweep = sweepTo(tip)
    end = cands.filter((q) => sweepTo(q) <= tipSweep + 1e-9).sort((q1, q2) => sweepTo(q1) - sweepTo(q2))[0]
    if (!end) throw new Error('topping/OD: no candidate on the arc')
  } else {
    end = tip
  }

  // outward closing line: radial for the flat case; for the pointed case rotate
  // +0.2° CCW (away from the space) so adjacent cuts overlap and clear the annulus
  const dirOut = flatTip ? v2.unit(end) : v2.rot(v2.unit(end), d2r(0.2))
  // Q on the Rcap circle: |end + s*dirOut| = Rcap
  const be = v2.dot(end, dirOut)
  const s = -be + Math.sqrt(be * be - v2.dot(end, end) + Rcap * Rcap)
  const Q = v2.add(end, v2.scale(dirOut, s))

  // mirror to the right side
  const mx = (pt) => [-pt[0], pt[1]]
  const xr = mx(x), yr = mx(y), er = mx(end), Qr = mx(Q)
  const cr = mx(c), br = mx(b)

  // boundary chain, counterclockwise-ordered loop (cw flag = arcByCenter isClockwise)
  const entities = [
    { kind: 'arc', start: x, end: y, center: c, cw: true, tag: 'workL' },
    { kind: 'arc', start: y, end, center: b, cw: false, tag: 'topL' },
    { kind: 'line', start: end, end: Q, tag: 'outL' },
    { kind: 'arc', start: Q, end: Qr, center: [0, 0], cw: true, tag: 'cap' },
    { kind: 'line', start: Qr, end: er, tag: 'outR' },
    // mirrored arcs traversed in reverse: mirror flips orientation, reversal
    // flips it back → same cw flag as the left counterparts (verified: 02 run 1
    // had these inverted and the server reported self-intersection at Rcap)
    { kind: 'arc', start: er, end: yr, center: br, cw: false, tag: 'topR' },
    { kind: 'arc', start: yr, end: xr, center: cr, cw: true, tag: 'workR' },
    { kind: 'arc', start: xr, end: x, center: a, cw: true, tag: 'root' },
  ]

  // consistency asserts (closure + arc radius equality — arcByCenter has zero tolerance)
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i], n = entities[(i + 1) % entities.length]
    const gap = v2.len(v2.sub(e.end, n.start))
    if (gap > 1e-9) throw new Error(`chain gap ${gap} after ${e.tag}`)
    if (e.kind === 'arc') {
      const r1 = v2.len(v2.sub(e.start, e.center))
      const r2 = v2.len(v2.sub(e.end, e.center))
      if (Math.abs(r1 - r2) > 1e-9) throw new Error(`arc ${e.tag} radius mismatch ${r1} vs ${r2}`)
    }
  }

  return {
    P, Dr, N, Rp, PD: 2 * Rp, R, A, B, E, W, V, Feff, Fstd, Ro, Rcap,
    tipR, flatTip, a, c, x, y, b, end, Q, entities,
    ansiOD: P * (0.6 + 1 / Math.tan(p)), // catalog pointed-tooth OD for reference
    rootR: Rp - R,
  }
}

/** Polygonize the tooth-space chain (dense polyline, for point-in-polygon + area). */
export function polygonizeSpace(tf, step = d2r(0.5)) {
  const pts = []
  for (const e of tf.entities) {
    if (e.kind === 'line') { pts.push(e.start); continue }
    const r = v2.len(v2.sub(e.start, e.center))
    let a0 = v2.ang(v2.sub(e.start, e.center))
    let a1 = v2.ang(v2.sub(e.end, e.center))
    if (e.cw) { while (a1 > a0) a1 -= 2 * Math.PI } else { while (a1 < a0) a1 += 2 * Math.PI }
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / step))
    for (let i = 0; i < n; i++) {
      const t = a0 + ((a1 - a0) * i) / n
      pts.push([e.center[0] + r * Math.cos(t), e.center[1] + r * Math.sin(t)])
    }
  }
  return pts
}

export function pointInPoly(pt, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

export function polyArea(poly) {
  let s = 0
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++)
    s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]
  return Math.abs(s) / 2
}

// ----------------------------------------------------------- sprocket assembly

/**
 * Full sprocket spec from user parameters (inches). Mirrors the image recipe.
 * cfg: { teeth, strands=1, hubStyle='B', bore, boreChamfer=0.03, keyway=false,
 *        setScrews=0, hubDia?, hubProj=0.5, customMode=false }
 */
export function sprocketSpec(cfg) {
  const { pitch: P, rollerDia: Dr, t1, t2, K } = CHAIN_35
  const N = cfg.teeth
  const strands = cfg.strands ?? 1
  const hubStyle = cfg.hubStyle ?? 'B'
  if (!cfg.customMode && (N < 10 || N > 45)) throw new Error('standard mode: 10..45T (use customMode)')
  if (strands < 1 || strands > 3) throw new Error('strands 1..3 (35B/D35B/T35B)')

  const blankOD = P / Math.sin(Math.PI / N) + P / 2 // PD + P/2
  const tf = toothForm({ P, Dr, N, blankOD })
  const tp = strands === 1 ? t1 : t2
  const maxHub = maxHubFor(N, P)
  const hubDia = cfg.hubDia ?? Math.min(maxHub, Math.max(2 * (cfg.bore ?? 0.5) + 0.75, 1.0))
  const reliefDia = maxHub // between-strand spacer diameter (chain-plate clearance)
  const hubProj = cfg.hubProj ?? 0.5
  const bore = cfg.bore ?? 0
  const maxBore = MARTIN35_HUB[N]?.maxBore
  if (bore && maxBore && bore > maxBore + 1e-9 && !cfg.customMode)
    throw new Error(`bore ${bore} exceeds Martin max ${maxBore} for ${N}T`)
  if (bore && hubStyle !== 'A' && bore >= hubDia - 0.1)
    throw new Error(`bore ${bore} leaves no hub wall (hubDia ${hubDia})`)

  // axial layout: toothed stack centered on v=0 (v = position along axis, inches)
  const stackW = (strands - 1) * K + tp
  const z0 = -stackW / 2
  const plates = []
  for (let i = 0; i < strands; i++) plates.push({ v0: z0 + i * K, v1: z0 + i * K + tp })
  const segs = [] // ordered axial segments {v0, v1, r}
  if (hubStyle === 'C') segs.push({ v0: z0 - hubProj, v1: z0, r: hubDia / 2, tag: 'hubF' })
  for (let i = 0; i < strands; i++) {
    segs.push({ v0: plates[i].v0, v1: plates[i].v1, r: tf.Ro, tag: `plate${i}` })
    if (i < strands - 1)
      segs.push({ v0: plates[i].v1, v1: plates[i + 1].v0, r: reliefDia / 2, tag: `spacer${i}` })
  }
  if (hubStyle === 'B' || hubStyle === 'C')
    segs.push({ v0: z0 + stackW, v1: z0 + stackW + hubProj, r: hubDia / 2, tag: 'hubB' })
  const vMin = segs[0].v0
  const vMax = segs[segs.length - 1].v1

  // blank cross-section polygon in (v, r), closed along the axis r=0
  const profile = [[vMin, 0]]
  for (const s of segs) {
    const last = profile[profile.length - 1]
    if (Math.abs(last[1] - s.r) > 1e-12) profile.push([s.v0, s.r])
    profile.push([s.v1, s.r])
  }
  profile.push([vMax, 0])

  // tip taper cut triangles per plate face: (r,v) triangles, slope 1/4 (P/2 radial ↔ P/8 lateral)
  const r0 = tf.Ro - P / 2
  const r1 = tf.Ro + 0.1
  const dz = (r1 - r0) / 4
  const tapers = []
  for (const pl of plates) {
    tapers.push([[r0, pl.v0], [r1, pl.v0], [r1, pl.v0 + dz]]) // face v0, material at +v
    tapers.push([[r0, pl.v1], [r1, pl.v1], [r1, pl.v1 - dz]]) // face v1, material at -v
  }

  // keyway + set screws
  const kw = cfg.keyway && bore ? keywayFor(bore) : null
  const screws = []
  const nScrews = hubStyle === 'A' ? 0 : Math.min(cfg.setScrews ?? 0, 2)
  if (nScrews && kw) {
    const hubSeg = segs.find((s) => s.tag === 'hubB') ?? segs.find((s) => s.tag === 'hubF')
    const vScrew = (hubSeg.v0 + hubSeg.v1) / 2
    // screw 1 at 90° from keyway, screw 2 opposite the keyway
    if (nScrews >= 1) screws.push({ v: vScrew, azimuth: 0, dia: kw.screwDia })
    if (nScrews >= 2) screws.push({ v: vScrew, azimuth: -90, dia: kw.screwDia })
  }

  // catalog number: [D|T]35<style><N>SS
  const prefix = strands === 2 ? 'D' : strands === 3 ? 'T' : ''
  const name = `${prefix}35${hubStyle}${N}SS`

  return {
    ...cfg, name, P, Dr, N, strands, hubStyle, tp, K,
    blankOD, tf, maxHub, hubDia, reliefDia, hubProj, bore,
    boreChamfer: cfg.boreChamfer ?? 0,
    stackW, plates, segs, vMin, vMax, profile, tapers, taperR0: r0, kw, screws,
    gapBetweenStrands: strands > 1 ? K - tp : 0,
  }
}

// --------------------------------------------------- Monte-Carlo verification

/**
 * Point-in-solid test for the finished sprocket (world frame: axis = axisDir,
 * profile-plane local +x = uDir, local +y = wDir; all unit world vectors).
 * pt is [x,y,z] in INCHES (world/25.4). Ignores the bore chamfer.
 */
export function makeInsideTest(spec, { axisDir, uDir, wDir }) {
  const poly = polygonizeSpace(spec.tf)
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const twoPiN = (2 * Math.PI) / spec.N
  return (pt) => {
    const v = dot(pt, axisDir)
    const su = dot(pt, uDir)
    const sw = dot(pt, wDir)
    const rho = hyp(su, sw)
    const seg = spec.segs.find((s) => v >= s.v0 - 1e-12 && v <= s.v1 + 1e-12)
    if (!seg) return false
    if (rho > seg.r) return false
    // bore + keyway + screws
    if (spec.bore && rho < spec.bore / 2) return false
    if (spec.kw) {
      // keyway drawn along local +y (wDir): slot |su|<=w/2, sw in [bore/2-.05, bore/2+depth]
      if (Math.abs(su) <= spec.kw.keyWidth / 2 + 1e-12 && sw >= spec.bore / 2 - 0.05 && sw <= spec.bore / 2 + spec.kw.keyDepth)
        return false
    }
    for (const sc of spec.screws ?? []) {
      // screw azimuth measured from local +x (uDir) in the (u,w) plane
      const az = d2r(sc.azimuth)
      const dU = Math.cos(az), dW = Math.sin(az)
      const along = su * dU + sw * dW
      if (along < 0) continue
      const perp2 = (su - along * dU) ** 2 + (sw - along * dW) ** 2 + (v - sc.v) ** 2
      if (perp2 < (sc.dia / 2) ** 2) return false
    }
    // toothed plate: tooth-space cut + tip taper
    const plate = spec.plates.find((p) => v >= p.v0 - 1e-12 && v <= p.v1 + 1e-12)
    if (plate) {
      if (rho > spec.tf.rootR - 0.05) {
        // fold azimuth into the drawn space frame (space centerline at local +y)
        let phi = Math.atan2(sw, su) - Math.PI / 2
        phi = phi - twoPiN * Math.round(phi / twoPiN)
        const lx = rho * Math.cos(phi + Math.PI / 2)
        const ly = rho * Math.sin(phi + Math.PI / 2)
        if (pointInPoly([lx, ly], poly)) return false
      }
      if (rho > spec.taperR0) {
        const depth = (rho - spec.taperR0) / 4
        if (v < plate.v0 + depth || v > plate.v1 - depth) return false
      }
    }
    return true
  }
}

/** MC volume (cubic inches) of the spec + a deterministic LCG for reproducibility. */
export function mcVolume(spec, basis, n = 400000) {
  const inside = makeInsideTest(spec, basis)
  const Rmax = Math.max(...spec.segs.map((s) => s.r))
  const { vMin, vMax } = spec
  let seed = 123456789
  const rnd = () => {
    seed = (1103515245 * seed + 12345) % 2147483648
    return seed / 2147483648
  }
  const { axisDir, uDir, wDir } = basis
  let hits = 0
  for (let i = 0; i < n; i++) {
    const v = vMin + (vMax - vMin) * rnd()
    const a = 2 * Rmax * rnd() - Rmax
    const b = 2 * Rmax * rnd() - Rmax
    const pt = [
      axisDir[0] * v + uDir[0] * a + wDir[0] * b,
      axisDir[1] * v + uDir[1] * a + wDir[1] * b,
      axisDir[2] * v + uDir[2] * a + wDir[2] * b,
    ]
    if (inside(pt)) hits++
  }
  const boxVol = (vMax - vMin) * (2 * Rmax) ** 2
  return { volume: (hits / n) * boxVol, hits, n }
}

// ------------------------------------------------------------- self-test

/** Verify against the gearseds worked example (#25, 30T). Throws on mismatch. */
export function selfTest() {
  const tf = toothForm({ P: 0.25, Dr: 0.13, N: 30, blankOD: 0.25 / Math.sin(Math.PI / 30) + 0.125 })
  const close = (a, b, tol, what) => {
    if (Math.abs(a - b) > tol) throw new Error(`selfTest ${what}: ${a} vs ${b}`)
  }
  close(tf.R, 0.0668, 5e-5, 'R')
  close((tf.A * 180) / Math.PI, 37.0, 1e-9, 'A')
  close((tf.B * 180) / Math.PI, 16.1333, 1e-3, 'B')
  close(tf.E, 0.1708, 5e-5, 'E')
  close(tf.W, 0.181, 5e-4, 'W')
  close(tf.V, 0.019, 5e-4, 'V')
  close(tf.Fstd, 0.105, 5e-4, 'Fstd')
  close(tf.PD, 2.3917, 5e-4, 'PD')
  return true
}
