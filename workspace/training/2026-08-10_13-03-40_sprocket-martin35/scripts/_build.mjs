/**
 * _build.mjs — ClassCAD builder for the Martin 35 SS sprocket.
 * Plane mapping (probed, 01-probe-planes): Top localXY→world XY, normal +Z;
 * Front localX→+X localY→-Z normal +Y; Right localX→+Z localY→-Y normal +X.
 * Sprocket axis = +X (profile sketches on Right, recipe default plane).
 * isClockwise=true = math-negative sweep in sketch-local coords (probed).
 */
import { inch, sprocketSpec, mcVolume } from './_model.mjs'

export const BASIS = { axisDir: [1, 0, 0], uDir: [0, 0, 1], wDir: [0, -1, 0] }

const mm = (v) => v * inch
const ok = (r, what) => {
  if (!r || r.maxLevel > 31 || r.result === null || r.result === undefined)
    throw new Error(`${what} failed: maxLevel=${r?.maxLevel} ${JSON.stringify(r?.messages ?? [])}`)
  return r.result
}

export async function buildSprocket(api, { filewrite }, cfg) {
  const spec = sprocketSpec(cfg)
  const report = { name: spec.name, spec: summarize(spec), steps: [], checks: [] }

  // ---- part + reference geometry
  const partR = await api.v1.part.create({ name: spec.name })
  const partId = ok(partR, 'part.create')
  const find = (cls, name) =>
    Object.values(partR.structure.tree).find((o) => o.class === cls && o.name === name).id
  const planes = { Top: find('CC_WorkPlane', 'Top'), Front: find('CC_WorkPlane', 'Front'), Right: find('CC_WorkPlane', 'Right') }
  const xAxis = find('CC_WorkAxis', 'XAxis')

  // ---- parameters block (recipe: "Parameters" first in the tree)
  const exprR = await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'pitch_in', value: spec.P },
      { name: 'teeth', value: spec.N },
      { name: 'strands', value: spec.strands },
      { name: 'bore_in', value: spec.bore },
      { name: 'hubDia_in', value: spec.hubDia },
      { name: 'hubProj_in', value: spec.hubProj },
      { name: 'blankOD_in', value: spec.blankOD },
      { name: 'toothThk_in', value: spec.tp },
      { name: 'strandSpacing_in', value: spec.K },
    ],
  })
  report.steps.push({ step: 'Parameters', level: exprR.maxLevel })

  // ---- 1. revolved blank (cross-section on Top: localX=v along +X, localY=r)
  const skBlank = ok(await api.v1.sketch.create({ id: partId, planeId: planes.Top, name: 'BlankSection' }), 'sketch Blank')
  const blankLines = []
  for (let i = 0; i < spec.profile.length; i++) {
    const a = spec.profile[i]
    const b = spec.profile[(i + 1) % spec.profile.length]
    blankLines.push({ startPos: [mm(a[0]), mm(a[1]), 0], endPos: [mm(b[0]), mm(b[1]), 0] })
  }
  const gBlank = await api.v1.sketch.geometry({
    id: skBlank, lines: blankLines,
    genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
  })
  const blankRev = ok(
    await api.v1.part.revolve({ id: partId, name: 'Blank', references: gBlank.result.lines, axisIds: [xAxis] }),
    'revolve Blank',
  )
  report.steps.push({ step: 'Blank', id: blankRev })

  // ---- 2. single tooth-space tool (on Right; local coords = construction coords)
  const skTooth = ok(await api.v1.sketch.create({ id: partId, planeId: planes.Right, name: 'ToothSpaceSketch' }), 'sketch Tooth')
  const arcs = [], lines = []
  for (const e of spec.tf.entities) {
    if (e.kind === 'line')
      lines.push({ startPos: [mm(e.start[0]), mm(e.start[1]), 0], endPos: [mm(e.end[0]), mm(e.end[1]), 0] })
    else
      arcs.push({
        startPos: [mm(e.start[0]), mm(e.start[1]), 0],
        endPos: [mm(e.end[0]), mm(e.end[1]), 0],
        centerPos: [mm(e.center[0]), mm(e.center[1]), 0],
        isClockwise: e.cw,
      })
  }
  const gTooth = await api.v1.sketch.geometry({
    id: skTooth, lines, arcsByCenter: arcs,
    genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
  })
  const toothRefs = [...gTooth.result.arcsByCenter, ...gTooth.result.lines]
  const cutSpan = mm(2 * Math.max(Math.abs(spec.vMin), Math.abs(spec.vMax)) + 0.2)
  const toothExt = ok(
    await api.v1.part.extrusion({
      id: partId, name: 'ToothSpace', references: toothRefs, type: 'SYMMETRIC', limit2: cutSpan,
    }),
    'extrude ToothSpace',
  )
  report.steps.push({ step: 'ToothSpace', id: toothExt })

  // ---- 3. circular pattern of the tool (count = N incl. original)
  // merged: 1 → single-brep pattern result; the subtraction references ONE tool
  // and is independent of the instance count (rainer)
  const pat = ok(
    await api.v1.part.circularPattern({
      id: partId, name: 'ToothPattern', targets: [toothExt], references: [xAxis],
      angle: (2 * Math.PI) / spec.N, count: spec.N, merged: 1,
    }),
    'circularPattern',
  )
  report.steps.push({ step: 'ToothPattern', id: pat })

  // ---- 4. tip-taper tools (revolved cone rings, one per plate face)
  const skTaper = ok(await api.v1.sketch.create({ id: partId, planeId: planes.Top, name: 'TipTaperSection' }), 'sketch Taper')
  const taperIds = []
  for (let t = 0; t < spec.tapers.length; t++) {
    const tri = spec.tapers[t] // [(r,v)...] → local (x=v, y=r)
    const triLines = []
    for (let i = 0; i < 3; i++) {
      const a = tri[i], b = tri[(i + 1) % 3]
      triLines.push({ startPos: [mm(a[1]), mm(a[0]), 0], endPos: [mm(b[1]), mm(b[0]), 0] })
    }
    const g = await api.v1.sketch.geometry({
      id: skTaper, lines: triLines,
      genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
    })
    taperIds.push(ok(
      await api.v1.part.revolve({ id: partId, name: `TipTaper${t}`, references: g.result.lines, axisIds: [xAxis] }),
      `revolve TipTaper${t}`,
    ))
  }
  report.steps.push({ step: 'TipTapers', ids: taperIds })

  // ---- 5. bore tool (cylinder along +X via rotated workCSys)
  let boreId = null
  if (spec.bore > 0) {
    const wcs = ok(
      await api.v1.part.workCSys({
        id: partId, name: 'BoreCS', offset: [mm(spec.vMin - 0.05), 0, 0], rotation: [0, Math.PI / 2, 0],
      }),
      'workCSys Bore',
    )
    boreId = ok(
      await api.v1.part.cylinder({
        id: partId, name: 'Bore', references: [wcs],
        diameter: mm(spec.bore), height: mm(spec.vMax - spec.vMin + 0.1),
      }),
      'cylinder Bore',
    )
    report.steps.push({ step: 'Bore', id: boreId })
  }

  // ---- 6. keyway tool (rect on Right at local +y, through all)
  let keyId = null
  if (spec.kw && spec.bore > 0) {
    const skKey = ok(await api.v1.sketch.create({ id: partId, planeId: planes.Right, name: 'KeywaySketch' }), 'sketch Keyway')
    const rect = ok(
      await api.v1.sketch.rectangle({
        id: skKey,
        startPos: [mm(-spec.kw.keyWidth / 2), mm(spec.bore / 2 - 0.05), 0],
        endPos: [mm(spec.kw.keyWidth / 2), mm(spec.bore / 2 + spec.kw.keyDepth), 0],
      }),
      'rect Keyway',
    )
    keyId = ok(
      await api.v1.part.extrusion({ id: partId, name: 'Keyway', references: rect, type: 'SYMMETRIC', limit2: cutSpan }),
      'extrude Keyway',
    )
    report.steps.push({ step: 'Keyway', id: keyId, kw: spec.kw })
  }

  // ---- 7. set-screw holes (azimuth 0 → +Z world → Top sketch; -90 → +Y world → Front sketch)
  const screwIds = []
  for (let i = 0; i < spec.screws.length; i++) {
    const sc = spec.screws[i]
    const plane = sc.azimuth === 0 ? 'Top' : 'Front'
    const sk = ok(
      await api.v1.sketch.create({ id: partId, planeId: planes[plane], name: `ScrewSketch${i}` }),
      `sketch Screw${i}`,
    )
    const circ = ok(
      await api.v1.sketch.circle({ id: sk, centerPos: [mm(sc.v), 0, 0], radius: mm(sc.dia / 2) }),
      `circle Screw${i}`,
    )
    screwIds.push(ok(
      await api.v1.part.extrusion({
        id: partId, name: `SetScrew${i + 1}`, references: [circ], type: 'UP',
        limit2: mm(spec.hubDia / 2 + 0.1),
      }),
      `extrude Screw${i}`,
    ))
  }
  if (screwIds.length) report.steps.push({ step: 'SetScrews', ids: screwIds })

  // ---- 8. one subtraction: blank − (tooth tool + pattern + tapers + bore + keyway + screws)
  // circularPattern CONSUMES its target (probed 01c): the pattern feature owns
  // all N instances incl. the original — toothExt must NOT appear in tools.
  const tools = [pat, ...taperIds]
  if (boreId) tools.push(boreId)
  if (keyId) tools.push(keyId)
  tools.push(...screwIds)
  const boolR = await api.v1.part.boolean({
    id: partId, type: 'SUBTRACTION', name: 'SprocketBody', target: blankRev, tools,
  })
  const bodyId = boolR.result
  report.steps.push({ step: 'Subtraction', id: bodyId, level: boolR.maxLevel, messages: boolR.messages })
  if (boolR.maxLevel > 31) throw new Error(`Subtraction failed: ${JSON.stringify(boolR.messages)}`)
  await api.v1.common.recalc({})

  // ---- 9. numeric checks BEFORE chamfer (bore rim still a clean edge)
  const expectArc = async (label, posIn, { radial, atX }) => {
    const pos = posIn.map(mm)
    const r = (await api.v1.part.getGeometryIds({
      id: partId, arcs: [{ pos }], circles: [{ pos }], lines: [{ pos }],
    })).result
    // no-match entries come back as EMPTY ARRAYS (truthy!) — keep numeric ids only
    const cands = [...(r?.arcs ?? []), ...(r?.circles ?? []), ...(r?.lines ?? [])]
      .flat().filter((x) => typeof x === 'number')
    if (!cands.length) {
      report.checks.push({ label, ok: false, reason: 'edge not found', posMM: pos })
      return
    }
    const gps = (await api.v1.part.getGeometryPositions({ elems: cands })).result ?? []
    let best = null
    for (const gp of gps) {
      for (const q of gp?.positions ?? []) {
        const rr = Math.hypot(q.y, q.z) / inch
        let err = 0
        if (radial !== undefined) err = Math.max(err, Math.abs(rr - radial))
        if (atX !== undefined) err = Math.max(err, Math.abs(q.x / inch - atX))
        if (!best || err < best.err) best = { err, id: gp.id }
      }
    }
    if (!best) {
      report.checks.push({ label, ok: false, reason: 'no positions returned', cands, posMM: pos })
      return
    }
    report.checks.push({ label, ok: best.err < 2e-3, worstErrIn: best.err, edgeId: best.id })
  }

  const pl0 = spec.plates[0]
  // root arc on front face of plate 0, at the drawn space centerline (world -Y)
  await expectArc('root-radius', [pl0.v0, -spec.tf.rootR, 0], { radial: spec.tf.rootR, atX: pl0.v0 })
  if (spec.tf.flatTip) {
    // tip-flat corner arc of first tooth (azimuth π/N from drawn space, dir [0,-cos,-sin])
    const th = Math.PI / spec.N
    const P8 = spec.P / 8
    await expectArc(
      'tip-flat-corner',
      [pl0.v0 + P8, -spec.tf.Ro * Math.cos(th), -spec.tf.Ro * Math.sin(th)],
      { radial: spec.tf.Ro, atX: pl0.v0 + P8 },
    )
    // same on the LAST plate (verifies strand spacing K for multi-strand)
    const plL = spec.plates[spec.plates.length - 1]
    if (spec.plates.length > 1)
      await expectArc(
        'tip-flat-corner-lastStrand',
        [plL.v0 + P8, -spec.tf.Ro * Math.cos(th), -spec.tf.Ro * Math.sin(th)],
        { radial: spec.tf.Ro, atX: plL.v0 + P8 },
      )
  }
  if (spec.bore > 0) await expectArc('bore-rim', [spec.vMin, spec.bore / 2, 0], { radial: spec.bore / 2, atX: spec.vMin })
  if (spec.hubStyle !== 'A') {
    // hub OD as a cylindrical FACE (rim circles are not reachable via arcs/circles
    // position lookup on revolve geometry): gp(face) → seam line + 2 rim-circle
    // midpoints — verify radius everywhere and that one rim sits at vMax.
    const hubSeg = spec.segs.find((s) => s.tag === 'hubB') ?? spec.segs.find((s) => s.tag === 'hubF')
    const vm = (hubSeg.v0 + hubSeg.v1) / 2
    const rHub = spec.hubDia / 2
    const rr = (await api.v1.part.getGeometryIds({
      id: partId,
      // probe at -Y/-Z azimuths — the set screws pierce the hub at +Z and +Y
      cylinders: [{ positions: [[mm(vm), -mm(rHub), 0], [mm(vm), 0, -mm(rHub)]] }],
    })).result?.cylinders?.flat().filter((x) => typeof x === 'number')
    if (!rr?.length) report.checks.push({ label: 'hub-od', ok: false, reason: 'cyl face not found' })
    else {
      const gp = (await api.v1.part.getGeometryPositions({ elems: [rr[0]] })).result?.[0]
      const pts = gp?.positions ?? []
      const radErr = Math.max(...pts.map((q) => Math.abs(Math.hypot(q.y, q.z) / inch - rHub)))
      const endErr = Math.min(...pts.map((q) => Math.abs(q.x / inch - hubSeg.v1)))
      const okHub = pts.length >= 3 && radErr < 2e-3 && endErr < 2e-3
      report.checks.push({ label: 'hub-od', ok: okHub, radErrIn: radErr, endErrIn: endErr, nPts: pts.length })
    }
  }

  // ---- 10. bore chamfer
  // The bore rim is NOT one edge: the subtracted cylinder's SEAM splits each
  // end rim into 2 arcs (plus the keyway walls). A single-position lookup finds
  // only one arc → partial chamfer (bug found by ph 2026-08-10: the chamfer
  // stopped at the seam). Sweep azimuths, verify every candidate, chamfer all.
  const rimDir = (thDeg) => {
    // radial dir in the (uDir=+Z, wDir=-Y) frame: world [0, -sin, cos]
    const t = (thDeg * Math.PI) / 180
    return [0, -Math.sin(t), Math.cos(t)]
  }
  // keyway sits at θ=90° — skip a generous sector around it
  const rimAzis = [0, 30, 60, 135, 180, 225, 270, 315]
  let chamferId = null
  if (spec.boreChamfer > 0 && spec.bore > 0) {
    const rims = new Set()
    const rb = spec.bore / 2
    for (const v of [spec.vMin, spec.vMax]) {
      for (const th of rimAzis) {
        const d = rimDir(th)
        const pos = [mm(v), mm(rb) * d[1], mm(rb) * d[2]]
        const rr = (await api.v1.part.getGeometryIds({
          id: partId, arcs: [{ pos }], circles: [{ pos }],
        })).result
        const cands = [...(rr?.arcs ?? []), ...(rr?.circles ?? [])]
          .flat().filter((x) => typeof x === 'number')
        for (const id of cands) {
          if (rims.has(id)) continue
          const gp = (await api.v1.part.getGeometryPositions({ elems: [id] })).result?.[0]
          const q = gp?.positions?.[0]
          if (q && Math.abs(Math.hypot(q.y, q.z) / inch - rb) < 1e-3 && Math.abs(q.x / inch - v) < 1e-3)
            rims.add(id)
        }
      }
    }
    if (rims.size) {
      const chR = await api.v1.part.chamfer({
        id: partId, name: 'BoreChamfer', references: [...rims],
        type: 'EQUAL_DISTANCE', distance1: mm(spec.boreChamfer),
      })
      chamferId = chR.result
      report.steps.push({ step: 'BoreChamfer', id: chamferId, level: chR.maxLevel, edges: rims.size })
      if (chR.maxLevel > 31) report.checks.push({ label: 'bore-chamfer', ok: false, messages: chR.messages })
      await api.v1.common.recalc({})
      // full-ring verification: the chamfer's outer edge (radius rb + c on each
      // end face) must exist at EVERY probed azimuth — a missed rim arc leaves
      // its sector's edge at radius rb on the face instead.
      const rc = rb + spec.boreChamfer
      let worst = 0
      for (const v of [spec.vMin, spec.vMax]) {
        for (const th of rimAzis) {
          const d = rimDir(th)
          const pos = [mm(v), mm(rc) * d[1], mm(rc) * d[2]]
          const rr = (await api.v1.part.getGeometryIds({
            id: partId, arcs: [{ pos }], circles: [{ pos }],
          })).result
          const cands = [...(rr?.arcs ?? []), ...(rr?.circles ?? [])]
            .flat().filter((x) => typeof x === 'number')
          let best = Infinity
          if (cands.length) {
            const gps = (await api.v1.part.getGeometryPositions({ elems: cands })).result ?? []
            for (const gp of gps)
              for (const q of gp?.positions ?? [])
                best = Math.min(best, Math.max(
                  Math.abs(Math.hypot(q.y, q.z) / inch - rc),
                  Math.abs(q.x / inch - v),
                ))
          }
          worst = Math.max(worst, best)
        }
      }
      report.checks.push({ label: 'bore-chamfer-full-ring', ok: worst < 2e-3, worstErrIn: worst, azisProbed: rimAzis.length * 2, rimArcs: rims.size })
    } else report.checks.push({ label: 'bore-chamfer-edges', ok: false, reason: 'rim arcs not found' })
  }

  // ---- 11. stainless appearance + mate connector CSys at the bore axis
  const tip = chamferId ?? bodyId
  if (tip) {
    const app = await api.v1.part.setAppearance({ target: tip, color: [199, 202, 209] })
    report.steps.push({ step: 'Appearance(SS)', level: app.maxLevel })
  }
  const mate = await api.v1.part.workCSys({
    id: partId, name: 'MateConnector', offset: [mm(spec.vMin), 0, 0], rotation: [0, Math.PI / 2, 0],
  })
  report.steps.push({ step: 'MateConnector', id: mate.result, level: mate.maxLevel })

  // ---- 12. volume + COG verification (MC cross-check, model-independent path in CAD)
  await api.v1.common.recalc({})
  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const volIn3 = mp.volume / inch ** 3
  const mc = mcVolume(spec, BASIS, 400000)
  // chamfer ring volume ≈ 2·(2π·rb·c²/2), not in the MC model
  const chamferVol = spec.boreChamfer > 0 && spec.bore > 0
    ? 2 * Math.PI * (spec.bore / 2) * spec.boreChamfer ** 2
    : 0
  const expected = mc.volume - chamferVol
  const dev = Math.abs(volIn3 - expected) / expected
  report.checks.push({
    label: 'volume', ok: dev < 0.025,
    cadIn3: +volIn3.toFixed(5), mcIn3: +mc.volume.toFixed(5), chamferAllowIn3: +chamferVol.toFixed(5),
    deviation: +(dev * 100).toFixed(2) + '%',
  })
  const cogOff = Math.hypot(mp.cog.y, mp.cog.z) / inch
  const cogX = mp.cog.x / inch
  report.checks.push({ label: 'cog', ok: cogOff < 0.05, offAxisIn: +cogOff.toFixed(4), alongAxisIn: +cogX.toFixed(4) })

  report.allChecksPass = report.checks.every((c) => c.ok)
  filewrite(report, `report-${spec.name}`)
  return { partId, spec, report, tip }
}

function summarize(spec) {
  return {
    name: spec.name, teeth: spec.N, strands: spec.strands, hubStyle: spec.hubStyle,
    PD: +spec.tf.PD.toFixed(4), blankOD: +spec.blankOD.toFixed(4), ansiOD: +spec.tf.ansiOD.toFixed(4),
    rootR: +spec.tf.rootR.toFixed(4), flatTip: spec.tf.flatTip, toothThk: spec.tp,
    bore: spec.bore, hubDia: +spec.hubDia.toFixed(4), hubProj: spec.hubProj,
    keyway: spec.kw, screws: spec.screws, vMin: +spec.vMin.toFixed(4), vMax: +spec.vMax.toFixed(4),
    strandGap: +spec.gapBetweenStrands.toFixed(4),
  }
}
