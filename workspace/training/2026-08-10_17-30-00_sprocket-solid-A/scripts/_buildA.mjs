/**
 * _buildA.mjs — variant A: destructive sprocket via solid.* / curve.* (EIF).
 * Per rainer's review of the first port:
 *  - NO sketches: all profiles are curve-API shapes filled INSIDE the entity
 *    injection (the EIF is a feature in the operation sequence and may only
 *    consume objects from EARLIER features — a sketch created after the EIF is
 *    a later feature and must not be referenced).
 *  - Build order reads like a history: create tool(s) → subtract → next
 *    (the EIF operation list in Buerligons shows the part at every step, not a
 *    pile of loose tool bodies with one subtraction at the end).
 * Model axis = +Z (profiles live in world XY, the curve API's native plane;
 * cross-sections are drawn in XY and rotated into XZ via curve.rotateShape).
 * Parametrics = re-run the generator. Same math as the other variants.
 */
import { inch, sprocketSpec, mcVolume } from './_model.mjs'

export const BASIS = { axisDir: [0, 0, 1], uDir: [1, 0, 0], wDir: [0, 1, 0] }
const mm = (v) => v * inch
const ok = (r, what) => {
  if (!r || r.maxLevel > 31 || r.result === null || r.result === undefined)
    throw new Error(`${what}: ${r?.maxLevel} ${JSON.stringify(r?.messages ?? [])}`)
  return r.result
}
// curve.* drawing calls (advancedPolyline, line, arcByCenter, rotateShape) return VOID
const okVoid = (r, what) => {
  if (!r || r.maxLevel > 31)
    throw new Error(`${what}: ${r?.maxLevel} ${JSON.stringify(r?.messages ?? [])}`)
}

export async function buildSolidSprocket(api, { filewrite }, cfg) {
  const spec = sprocketSpec(cfg)
  const report = { name: spec.name + '-solid', checks: [], steps: [] }
  const partId = ok(await api.v1.part.create({ name: report.name }), 'part')
  const eif = ok(await api.v1.part.entityInjection({ id: partId, name: 'Body' }), 'eif')

  // (r,v) cross-section profile → shape in the XZ plane (draw XY, rotate 90° about X)
  const sectionShape = async (pts, name) => {
    const sh = ok(await api.v1.curve.shape({ id: eif, name }), name)
    okVoid(await api.v1.curve.advancedPolyline({
      id: sh, pld: pts.map(([r, v]) => ({ xa: mm(r), ya: mm(v) })), close: true,
    }), name + ' pld')
    okVoid(await api.v1.curve.rotateShape({ id: sh, rotation: [Math.PI / 2, 0, 0] }), name + ' rot')
    return sh
  }
  const subtract = async (tools, what) => {
    const r = await api.v1.solid.subtraction({ id: eif, target: blank, tools, keepTools: false })
    if (r.maxLevel > 31) throw new Error(`subtract ${what}: ${JSON.stringify(r.messages)}`)
    report.steps.push({ step: `cut ${what}`, tools: tools.length })
  }

  // ---- 1. blank (revolve the (v,r) staircase about +Z)
  const blankSh = await sectionShape(spec.profile.map(([v, r]) => [r, v]), 'BlankProfile')
  const blank = ok(await api.v1.solid.revolve({
    id: eif, originPos: [0, 0, 0], direction: [0, 0, 1], angle: 2 * Math.PI, curves: blankSh,
  }), 'blank revolve')
  report.steps.push({ step: 'blank', id: blank })

  // ---- 2. tooth spaces: ONE curve-API profile (world XY, space centerline +Y),
  //         N extrusions rotated about Z — then subtract
  // ONE closed polyline2d with signed bulges — hand-assembled line/arc chains
  // are NOT reliable in shapes (the kernel re-picks arc branches, ignoring
  // isClockwise; probed 00c/00d). bulge = tan(sweep/4), sign: + = CCW.
  const spaceSh = ok(await api.v1.curve.shape({ id: eif, name: 'SpaceProfile' }), 'space shape')
  const pts = [], bulges = []
  for (const e of spec.tf.entities) {
    pts.push([mm(e.start[0]), mm(e.start[1]), 0])
    if (e.kind === 'line') { bulges.push(0); continue }
    const a0 = Math.atan2(e.start[1] - e.center[1], e.start[0] - e.center[0])
    const a1 = Math.atan2(e.end[1] - e.center[1], e.end[0] - e.center[0])
    let sweep = a1 - a0
    if (e.cw) { while (sweep > 0) sweep -= 2 * Math.PI } else { while (sweep < 0) sweep += 2 * Math.PI }
    bulges.push(Math.tan(sweep / 4))
  }
  okVoid(await api.v1.curve.polyline2d({ id: spaceSh, points: pts, bulges, close: true }), 'space polyline')
  const span = mm(spec.vMax - spec.vMin + 0.2)
  const spaceTools = []
  for (let k = 0; k < spec.N; k++)
    spaceTools.push(ok(await api.v1.solid.extrusion({
      id: eif, curves: spaceSh, direction: [0, 0, span],
      rotation: [0, 0, (k * 2 * Math.PI) / spec.N],
      translation: [0, 0, mm(spec.vMin - 0.1)],
    }), `space ${k}`))
  await subtract(spaceTools, `tooth spaces ×${spec.N}`)

  // ---- 3. bore (cylinder is centered and Z-axis native here) → subtract
  const zMid = mm((spec.vMin + spec.vMax) / 2)
  if (spec.bore > 0) {
    const bore = ok(await api.v1.solid.cylinder({
      id: eif, diameter: mm(spec.bore), height: mm(spec.vMax - spec.vMin + 0.2),
      translation: [0, 0, zMid],
    }), 'bore')
    await subtract([bore], 'bore')
  }

  // ---- 4. keyway (slot at +Y, ASME B17.1) → subtract
  if (spec.kw && spec.bore > 0) {
    const rb = spec.bore / 2, s = 0.05
    const y0 = mm(rb - s), y1 = mm(rb + spec.kw.keyDepth)
    const key = ok(await api.v1.solid.box({
      id: eif, length: mm(spec.kw.keyWidth), width: y1 - y0, height: mm(spec.vMax - spec.vMin + 0.2),
      translation: [0, (y0 + y1) / 2, zMid],
    }), 'keyway')
    await subtract([key], 'keyway')
  }

  // ---- 5. set screws (radial: azimuth 0 → +X, azimuth −90 → −Y) → subtract
  const screwTools = []
  for (const [i, sc] of (spec.screws ?? []).entries()) {
    const H = mm(spec.hubDia / 2 + 0.1)
    const rot = sc.azimuth === 0 ? [0, Math.PI / 2, 0] : [Math.PI / 2, 0, 0]
    const tr = sc.azimuth === 0 ? [H / 2, 0, mm(sc.v)] : [0, -H / 2, mm(sc.v)]
    screwTools.push(ok(await api.v1.solid.cylinder({
      id: eif, diameter: mm(sc.dia), height: H, rotation: rot, translation: tr,
    }), `screw${i}`))
  }
  if (screwTools.length) await subtract(screwTools, `set screws ×${screwTools.length}`)

  // ---- 6. tip tapers (revolved cone rings) → subtract
  const taperTools = []
  for (const [i, tri] of spec.tapers.entries())
    taperTools.push(ok(await api.v1.solid.revolve({
      id: eif, originPos: [0, 0, 0], direction: [0, 0, 1], angle: 2 * Math.PI,
      curves: await sectionShape(tri, `Taper${i}`),
    }), `taper${i}`))
  if (taperTools.length) await subtract(taperTools, `tip tapers ×${taperTools.length}`)

  // ---- 7. bore chamfers (45° cone-ring cuts) → subtract
  if (spec.boreChamfer > 0 && spec.bore > 0) {
    const c = spec.boreChamfer, rb = spec.bore / 2, d = 0.02
    const chamferTools = []
    for (const [name, tri] of [
      ['ChamferF', [[rb + c + d, spec.vMin - d], [rb - 0.05, spec.vMin - d], [rb - 0.05, spec.vMin + c + 0.05]]],
      ['ChamferB', [[rb + c + d, spec.vMax + d], [rb - 0.05, spec.vMax + d], [rb - 0.05, spec.vMax - c - 0.05]]],
    ])
      chamferTools.push(ok(await api.v1.solid.revolve({
        id: eif, originPos: [0, 0, 0], direction: [0, 0, 1], angle: 2 * Math.PI,
        curves: await sectionShape(tri, name),
      }), name))
    await subtract(chamferTools, 'bore chamfers')
  }
  // NOTE: no common.recalc in direct-modeling flows — it destroys the EIF body.

  // ---- verification: MC volume + COG + brep probes (Z-axis frame)
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const volIn3 = mp.volume / inch ** 3
  const mc = mcVolume(spec, BASIS, 400000)
  const chamferVol = spec.boreChamfer > 0 && spec.bore > 0
    ? 2 * Math.PI * (spec.bore / 2) * spec.boreChamfer ** 2 : 0
  const expected = mc.volume - chamferVol
  const dev = Math.abs(volIn3 - expected) / expected
  report.checks.push({ label: 'volume', ok: dev < 0.025, cadIn3: +volIn3.toFixed(5), mcAdjIn3: +expected.toFixed(5), devPct: +(dev * 100).toFixed(2) })
  const cogOff = Math.hypot(mp.cog.x, mp.cog.y) / inch
  report.checks.push({ label: 'cog', ok: cogOff < 0.05, offAxisIn: +cogOff.toFixed(4), alongIn: +(mp.cog.z / inch).toFixed(4) })

  const probe = async (label, posIn, { radial, atZ }) => {
    const pos = posIn.map(mm)
    const rr = (await api.v1.part.getGeometryIds({ id: partId, arcs: [{ pos }], circles: [{ pos }], lines: [{ pos }] })).result
    const cands = [...(rr?.arcs ?? []), ...(rr?.circles ?? []), ...(rr?.lines ?? [])].flat().filter((x) => typeof x === 'number')
    let best = null
    if (cands.length) {
      const gps = (await api.v1.part.getGeometryPositions({ elems: cands })).result ?? []
      for (const gp of gps)
        for (const q of gp?.positions ?? []) {
          let err = 0
          if (radial !== undefined) err = Math.max(err, Math.abs(Math.hypot(q.x, q.y) / inch - radial))
          if (atZ !== undefined) err = Math.max(err, Math.abs(q.z / inch - atZ))
          if (best === null || err < best) best = err
        }
    }
    report.checks.push({ label, ok: best !== null && best < 2e-3, errIn: best })
  }
  const pl0 = spec.plates[0]
  await probe('root', [0, spec.tf.rootR, pl0.v0], { radial: spec.tf.rootR, atZ: pl0.v0 })
  if (spec.tf.flatTip) {
    const th = Math.PI / spec.N, P8 = spec.P / 8
    await probe('tip-flat-corner', [-spec.tf.Ro * Math.sin(th), spec.tf.Ro * Math.cos(th), pl0.v0 + P8], { radial: spec.tf.Ro, atZ: pl0.v0 + P8 })
  }

  report.allChecksPass = report.checks.every((c) => c.ok)
  filewrite(report, `report-${report.name}`)
  return { partId, spec, report }
}
