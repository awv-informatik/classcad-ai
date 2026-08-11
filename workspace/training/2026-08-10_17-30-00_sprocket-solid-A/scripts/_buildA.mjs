/**
 * _buildA.mjs — variant A: honest DESTRUCTIVE sprocket via solid.* (EIF).
 * Same math (_model.mjs) as the generated variant; no feature tree pretensions:
 * blank revolve, one tooth-space profile extruded N times with a rotation
 * transform, bore/keyway/screw primitives, taper + chamfer as revolved cone
 * cuts, everything removed by solid.subtraction (target mutates in place).
 * Parametrics = re-run the generator (the point of variant A per the Kollege).
 */
import { inch, sprocketSpec, mcVolume, makeInsideTest } from './_model.mjs'

export const BASIS = { axisDir: [1, 0, 0], uDir: [0, 0, 1], wDir: [0, -1, 0] }
const mm = (v) => v * inch
const ok = (r, what) => {
  if (!r || r.maxLevel > 31 || r.result === null || r.result === undefined)
    throw new Error(`${what}: ${r?.maxLevel} ${JSON.stringify(r?.messages ?? [])}`)
  return r.result
}
// curve.advancedPolyline (like curve.circle) returns VOID — only maxLevel counts
const okVoid = (r, what) => {
  if (!r || r.maxLevel > 31)
    throw new Error(`${what}: ${r?.maxLevel} ${JSON.stringify(r?.messages ?? [])}`)
}

export async function buildSolidSprocket(api, { filewrite }, cfg) {
  const spec = sprocketSpec(cfg)
  const report = { name: spec.name + '-solid', checks: [], steps: [] }
  const partId = ok(await api.v1.part.create({ name: report.name }), 'part')
  const eif = ok(await api.v1.part.entityInjection({ id: partId, name: 'Body' }), 'eif')

  // ---- blank: revolve the (v,r) staircase about world X (curve coords = world XY)
  const shape = ok(await api.v1.curve.shape({ id: eif, name: 'BlankProfile' }), 'shape')
  void okVoid(await api.v1.curve.advancedPolyline({
    id: shape,
    pld: spec.profile.map(([v, r]) => ({ xa: mm(v), ya: mm(r) })),
    close: true,
  }), 'blank pld')
  const blank = ok(await api.v1.solid.revolve({
    id: eif, originPos: [0, 0, 0], direction: [1, 0, 0], angle: 2 * Math.PI, curves: shape,
  }), 'blank revolve')

  // ---- tooth-space tools: ONE profile sketch (Right plane), N rotated extrusions
  const partTree = (await api.v1.common.batch({ jobs: [{ api: 'v1.part.getWorkGeometry', param: { id: partId, name: 'Right' } }] })).result
  const rightId = partTree?.[0]?.result
  const sk = ok(await api.v1.sketch.create({ id: partId, planeId: rightId, name: 'SpaceProfile' }), 'sketch')
  const arcs = [], lines = []
  for (const e of spec.tf.entities) {
    if (e.kind === 'line')
      lines.push({ startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0] })
    else
      arcs.push({
        startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0],
        centerPos: [mm(e.center[0]), mm(e.center[1]), 0], isClockwise: e.cw,
      })
  }
  const g = await api.v1.sketch.geometry({
    id: sk, lines, arcsByCenter: arcs,
    genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
  })
  const profRefs = [...g.result.arcsByCenter, ...g.result.lines]
  const span = mm(spec.vMax - spec.vMin + 0.2)
  const tools = []
  for (let k = 0; k < spec.N; k++) {
    tools.push(ok(await api.v1.solid.extrusion({
      id: eif, curves: profRefs, direction: [span, 0, 0],
      rotation: [(k * 2 * Math.PI) / spec.N, 0, 0],
      translation: [mm(spec.vMin - 0.1), 0, 0],
      rotateFirst: true,
    }), `space ${k}`))
  }
  report.steps.push({ blank, spaces: tools.length })

  // ---- bore (solid.cylinder is CENTERED; rotate z→X, translate to span middle)
  const midV = mm((spec.vMin + spec.vMax) / 2)
  if (spec.bore > 0)
    tools.push(ok(await api.v1.solid.cylinder({
      id: eif, diameter: mm(spec.bore), height: mm(spec.vMax - spec.vMin + 0.2),
      rotation: [0, Math.PI / 2, 0], translation: [midV, 0, 0],
    }), 'bore'))

  // ---- keyway (solid.box centered; slot at world −Y like the other variants)
  if (spec.kw && spec.bore > 0) {
    const rb = spec.bore / 2, s = 0.05
    const y0 = -mm(rb + spec.kw.keyDepth), y1 = -mm(rb - s)
    tools.push(ok(await api.v1.solid.box({
      id: eif, length: mm(spec.vMax - spec.vMin + 0.2), width: y1 - y0, height: mm(spec.kw.keyWidth),
      translation: [midV, (y0 + y1) / 2, 0],
    }), 'keyway'))
  }

  // ---- set screws (centered cylinders: +Z stays, +Y via Rx(−90°))
  for (const [i, sc] of (spec.screws ?? []).entries()) {
    const H = mm(spec.hubDia / 2 + 0.1)
    const rot = sc.azimuth === 0 ? [0, 0, 0] : [-Math.PI / 2, 0, 0]
    const tr = sc.azimuth === 0 ? [mm(sc.v), 0, H / 2] : [mm(sc.v), H / 2, 0]
    tools.push(ok(await api.v1.solid.cylinder({
      id: eif, diameter: mm(sc.dia), height: H, rotation: rot, translation: tr,
    }), `screw${i}`))
  }

  // ---- tip tapers + bore chamfers as revolved cone cuts (the destructive way)
  const revTri = async (pts, name) => {
    const sh = ok(await api.v1.curve.shape({ id: eif, name }), name + ' shape')
    void okVoid(await api.v1.curve.advancedPolyline({
      id: sh, pld: pts.map(([v, r]) => ({ xa: mm(v), ya: mm(r) })), close: true,
    }), name + ' pld')
    return ok(await api.v1.solid.revolve({
      id: eif, originPos: [0, 0, 0], direction: [1, 0, 0], angle: 2 * Math.PI, curves: sh,
    }), name)
  }
  for (const [i, tri] of spec.tapers.entries())
    tools.push(await revTri(tri.map(([r, v]) => [v, r]), `Taper${i}`))
  if (spec.boreChamfer > 0 && spec.bore > 0) {
    const c = spec.boreChamfer, rb = spec.bore / 2, d = 0.02
    tools.push(await revTri(
      [[spec.vMin - d, rb + c + d], [spec.vMin - d, rb - 0.05], [spec.vMin + c + 0.05, rb - 0.05]],
      'ChamferF',
    ))
    tools.push(await revTri(
      [[spec.vMax + d, rb + c + d], [spec.vMax + d, rb - 0.05], [spec.vMax - c - 0.05, rb - 0.05]],
      'ChamferB',
    ))
  }

  // ---- one destructive subtraction (target mutates in place, id stays `blank`)
  const sub = await api.v1.solid.subtraction({ id: eif, target: blank, tools, keepTools: false })
  if (sub.maxLevel > 31) throw new Error('subtraction: ' + JSON.stringify(sub.messages))
  // NO common.recalc here — direct EIF geometry is not feature-history-backed;
  // recalc after solid ops risks the known invalidation bug (TODO "Recalc
  // Invalidation"), and 00-diag showed massProps works fine without it.
  report.steps.push({ subtractedTools: tools.length })

  // ---- verification: MC volume (chamfer modeled via allowance) + COG + brep probes
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const volIn3 = mp.volume / inch ** 3
  const mc = mcVolume(spec, BASIS, 400000)
  const chamferVol = spec.boreChamfer > 0 && spec.bore > 0
    ? 2 * Math.PI * (spec.bore / 2) * spec.boreChamfer ** 2 : 0
  const expected = mc.volume - chamferVol
  const dev = Math.abs(volIn3 - expected) / expected
  report.checks.push({ label: 'volume', ok: dev < 0.025, cadIn3: +volIn3.toFixed(5), mcAdjIn3: +expected.toFixed(5), devPct: +(dev * 100).toFixed(2) })
  const cogOff = Math.hypot(mp.cog.y, mp.cog.z) / inch
  report.checks.push({ label: 'cog', ok: cogOff < 0.05, offAxisIn: +cogOff.toFixed(4), alongIn: +(mp.cog.x / inch).toFixed(4) })

  const probe = async (label, posIn, { radial, atX }) => {
    const pos = posIn.map(mm)
    const rr = (await api.v1.part.getGeometryIds({ id: partId, arcs: [{ pos }], circles: [{ pos }], lines: [{ pos }] })).result
    const cands = [...(rr?.arcs ?? []), ...(rr?.circles ?? []), ...(rr?.lines ?? [])].flat().filter((x) => typeof x === 'number')
    let best = null
    if (cands.length) {
      const gps = (await api.v1.part.getGeometryPositions({ elems: cands })).result ?? []
      for (const gp of gps)
        for (const q of gp?.positions ?? []) {
          let err = 0
          if (radial !== undefined) err = Math.max(err, Math.abs(Math.hypot(q.y, q.z) / inch - radial))
          if (atX !== undefined) err = Math.max(err, Math.abs(q.x / inch - atX))
          if (best === null || err < best) best = err
        }
    }
    report.checks.push({ label, ok: best !== null && best < 2e-3, errIn: best })
  }
  const pl0 = spec.plates[0]
  await probe('root', [pl0.v0, -spec.tf.rootR, 0], { radial: spec.tf.rootR, atX: pl0.v0 })
  if (spec.tf.flatTip) {
    const th = Math.PI / spec.N, P8 = spec.P / 8
    await probe('tip-flat-corner', [pl0.v0 + P8, -spec.tf.Ro * Math.cos(th), -spec.tf.Ro * Math.sin(th)], { radial: spec.tf.Ro, atX: pl0.v0 + P8 })
  }

  report.allChecksPass = report.checks.every((c) => c.ok)
  filewrite(report, `report-${report.name}`)
  return { partId, spec, report }
}
