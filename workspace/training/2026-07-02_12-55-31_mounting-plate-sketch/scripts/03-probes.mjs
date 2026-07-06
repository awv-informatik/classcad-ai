// 03 — isolate the CalcBulges/fillet-collapse failure with independent sketches on ONE part
// (solver is per-sketch, part.create works once per run):
//   S1  seeds-only, all gen* off  → creation fidelity: bulge sign/magnitude + radius per arc
//   S2a one arm, full scheme      → does the R3 fillet survive + solve to exact?
//   S2b one arm, NO gauge tangencies → discriminates the tangent-beyond-segment suspicion
//   S3  notch in isolation        → T/T/ON/ON/center-on-clv + R33
//   S4  blend in isolation        → T/T/ON/ON + R100
import { model, EXACT, ROUGH, ARC_KEYS, LINE_KEYS, CIRCLE_KEYS } from './_model.mjs'

const P3 = p => [p[0], p[1], 0]

export default async function (api, { filewrite }) {
  const MR = model(ROUGH)
  const ME = model(EXACT)
  const partR = await api.v1.part.create({ name: 'Probes' })
  const partId = partR.result
  const wp = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const newSketch = async name =>
    (await api.v1.sketch.create({ id: partId, planeId: wp.id, name })).result

  const pos = async pid => {
    const r = (await api.v1.sketch.getPositions({ id: pid })).result
    return r?.pos ? [r.pos.x, r.pos.y] : null
  }
  const arcInfo = (tree, aid) => {
    const n = tree[String(aid)]
    return { bulge: n?.members?.bulge?.value, cls: n?.class }
  }

  // ---------- S1: seeds only, gen* OFF — verify creation fidelity ----------
  {
    const sk = await newSketch('S1')
    const g = await api.v1.sketch.geometry({
      id: sk, genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
      lines: LINE_KEYS.map(k => ({ startPos: P3(MR[k].a), endPos: P3(MR[k].b) })),
      arcsByCenter: ARC_KEYS.map(k => ({
        startPos: P3(MR[k].s), endPos: P3(MR[k].e), centerPos: P3(MR[k].c), isClockwise: MR[k].cw,
      })),
      circles: CIRCLE_KEYS.map(k => ({ centerPos: P3(MR[k].c), radius: MR[k].r })),
    })
    const tree = g.structure.tree
    const rows = []
    for (let i = 0; i < ARC_KEYS.length; i++) {
      const k = ARC_KEYS[i]
      const a = MR[k]
      const v1 = [a.s[0] - a.c[0], a.s[1] - a.c[1]]
      const v2 = [a.e[0] - a.c[0], a.e[1] - a.c[1]]
      let sweep = Math.atan2(a.cw ? v1[0] * v2[1] - v1[1] * v2[0] : -(v1[0] * v2[1] - v1[1] * v2[0]),
        -(v1[0] * v2[0] + v1[1] * v2[1])) + Math.PI // sweep in (0, 2π)
      const predBulge = (a.cw ? -1 : 1) * Math.tan(sweep / 4)
      const got = arcInfo(tree, g.result.arcsByCenter[i])
      rows.push({ k, cw: a.cw, predBulge: +predBulge.toFixed(6), gotBulge: got.bulge, cls: got.cls })
    }
    filewrite(rows, 's1-bulges')
    console.log('[S1] maxLevel:', g.maxLevel)
    for (const r of rows) console.log('   ', JSON.stringify(r))
  }

  // helper: circle with fixed center + diameter dim (a local datum island)
  const fixedCircle = async (sk, c, r, dia) => {
    const id = (await api.v1.sketch.circle({ id: sk, centerPos: P3(c), radius: r })).result
    const cp = (await api.v1.sketch.getPoints({ id })).result.centerId
    await api.v1.sketch.constraint({ id: sk, type: 'FIXATION', geomIds: [cp] })
    if (dia) await api.v1.sketch.dimension({ id: sk, type: 'DIAMETER', geomIds: [id], value: dia })
    return { id, cp }
  }

  // one-arm probe: returns solved fillet radius + junction error vs EXACT
  const armProbe = async (label, { gaugeTangent }) => {
    const sk = await newSketch(label)
    // hub + boss at EXACT centers/sizes (isolate the arm: its anchors are already final)
    const hub = await fixedCircle(sk, [0, 0], EXACT.RHUB, 60)
    const boss = await fixedCircle(sk, ME.B, EXACT.RBOSS, 40)
    const gauge = (await api.v1.sketch.circle({ id: sk, centerPos: P3(ME.B), radius: ROUGH.RG, isConstruction: true })).result
    // rough arm seeds RELATIVE to exact anchors: recompute model with rough RG/R3 only
    const MA = model({ ...EXACT, RG: ROUGH.RG, R3: ROUGH.R3 })
    const mk = {}
    for (const k of ['edgeRO', 'edgeRI']) mk[k] = (await api.v1.sketch.line({ id: sk, startPos: P3(MA[k].a), endPos: P3(MA[k].b) })).result
    for (const k of ['f3RO', 'f3RI']) mk[k] = (await api.v1.sketch.arcByCenter({
      id: sk, startPos: P3(MA[k].s), endPos: P3(MA[k].e), centerPos: P3(MA[k].c), isClockwise: MA[k].cw,
    })).result
    const pts = {}
    for (const k of Object.keys(mk)) pts[k] = (await api.v1.sketch.getPoints({ id: mk[k] })).result
    const T = (a, b) => ({ id: sk, type: 'TANGENT', geomIds: [a, b] })
    const cons = []
    for (const s of ['RO', 'RI']) {
      const e = mk[`edge${s}`], f = mk[`f3${s}`], pe = pts[`edge${s}`], pf = pts[`f3${s}`]
      cons.push(
        T(e, hub.id), { id: sk, type: 'COINCIDENT', geomIds: [pe.startId, hub.id] },
        ...(gaugeTangent ? [T(e, gauge)] : []),
        { id: sk, type: 'COINCIDENT', geomIds: [pe.endId, pf.startId] }, T(e, f),
        T(f, boss.id), { id: sk, type: 'COINCIDENT', geomIds: [pf.endId, boss.id] },
      )
    }
    if (gaugeTangent) cons.push({ id: sk, type: 'CONCENTRIC', geomIds: [gauge, boss.id] })
    const rc = await api.v1.sketch.constraint(cons)
    const rd = await api.v1.sketch.dimension([
      ...(gaugeTangent ? [{ id: sk, type: 'DIAMETER', geomIds: [gauge], value: 6 }] : []),
      { id: sk, type: 'RADIUS', geomIds: [mk.f3RO], value: 3 },
      { id: sk, type: 'RADIUS', geomIds: [mk.f3RI], value: 3 },
    ])
    // readback vs EXACT
    const out = {}
    for (const k of Object.keys(mk)) {
      out[k] = {}
      for (const [pk, pid] of Object.entries(pts[k])) out[k][pk] = await pos(pid)
    }
    const errs = []
    const chk = (k, got, want) => { if (got) errs.push({ k, err: +Math.hypot(got[0] - want[0], got[1] - want[1]).toExponential(2) }) }
    chk('edgeRO.s', out.edgeRO.startId, ME.edgeRO.a); chk('edgeRO.e', out.edgeRO.endId, ME.edgeRO.b)
    chk('f3RO.c', out.f3RO.centerId, ME.f3RO.c); chk('f3RI.c', out.f3RI.centerId, ME.f3RI.c)
    const rFil = out.f3RO.startId && out.f3RO.centerId
      ? Math.hypot(out.f3RO.startId[0] - out.f3RO.centerId[0], out.f3RO.startId[1] - out.f3RO.centerId[1]) : null
    console.log(`[${label}] cons:`, rc.maxLevel, 'dims:', rd.maxLevel, 'f3RO radius:', rFil, 'errs:', JSON.stringify(errs))
    return { rc: rc.maxLevel, rd: rd.maxLevel, rFil, errs }
  }
  const s2a = await armProbe('S2a', { gaugeTangent: true })
  const s2b = await armProbe('S2b', { gaugeTangent: false })

  // ---------- S3: notch in isolation ----------
  {
    const sk = await newSketch('S3')
    const bR = await fixedCircle(sk, ME.B, EXACT.RBOSS, 40)
    const bL = await fixedCircle(sk, [-ME.B[0], ME.B[1]], EXACT.RBOSS, 40)
    const clv = (await api.v1.sketch.line({ id: sk, startPos: [0, -130, 0], endPos: [0, 40, 0], isConstruction: true })).result
    const pclv = (await api.v1.sketch.getPoints({ id: clv })).result
    await api.v1.sketch.constraint([
      { id: sk, type: 'FIXATION', geomIds: [pclv.startId] }, { id: sk, type: 'FIXATION', geomIds: [pclv.endId] },
    ])
    const MN = model({ ...EXACT, RN: ROUGH.RN })
    const n = (await api.v1.sketch.arcByCenter({
      id: sk, startPos: P3(MN.notch.s), endPos: P3(MN.notch.e), centerPos: P3(MN.notch.c), isClockwise: MN.notch.cw,
    })).result
    const pn = (await api.v1.sketch.getPoints({ id: n })).result
    const rc = await api.v1.sketch.constraint([
      { id: sk, type: 'TANGENT', geomIds: [n, bR.id] }, { id: sk, type: 'TANGENT', geomIds: [n, bL.id] },
      { id: sk, type: 'COINCIDENT', geomIds: [pn.startId, bR.id] }, { id: sk, type: 'COINCIDENT', geomIds: [pn.endId, bL.id] },
      { id: sk, type: 'COINCIDENT', geomIds: [pn.centerId, clv] },
    ])
    const rd = await api.v1.sketch.dimension({ id: sk, type: 'RADIUS', geomIds: [n], value: 33 })
    const c = await pos(pn.centerId), s = await pos(pn.startId)
    const errC = Math.hypot(c[0] - ME.notch.c[0], c[1] - ME.notch.c[1])
    console.log('[S3] cons:', rc.maxLevel, 'dim:', rd.maxLevel, 'center:', JSON.stringify(c), 'errC:', +errC.toExponential(2))
  }

  // ---------- S4: blend in isolation ----------
  {
    const sk = await newSketch('S4')
    const hub = await fixedCircle(sk, [0, 0], EXACT.RHUB, 60)
    const boss = await fixedCircle(sk, ME.B, EXACT.RBOSS, 40)
    const MB = model({ ...EXACT, RF: ROUGH.RF })
    const b = (await api.v1.sketch.arcByCenter({
      id: sk, startPos: P3(MB.blendR.s), endPos: P3(MB.blendR.e), centerPos: P3(MB.blendR.c), isClockwise: MB.blendR.cw,
    })).result
    const pb = (await api.v1.sketch.getPoints({ id: b })).result
    const rc = await api.v1.sketch.constraint([
      { id: sk, type: 'TANGENT', geomIds: [b, hub.id] }, { id: sk, type: 'TANGENT', geomIds: [b, boss.id] },
      { id: sk, type: 'COINCIDENT', geomIds: [pb.startId, hub.id] }, { id: sk, type: 'COINCIDENT', geomIds: [pb.endId, boss.id] },
    ])
    const rd = await api.v1.sketch.dimension({ id: sk, type: 'RADIUS', geomIds: [b], value: 100 })
    const c = await pos(pb.centerId)
    const errC = Math.hypot(c[0] - ME.blendR.c[0], c[1] - ME.blendR.c[1])
    console.log('[S4] cons:', rc.maxLevel, 'dim:', rd.maxLevel, 'center:', JSON.stringify(c), 'errC:', +errC.toExponential(2))
  }

  return { partId }
}
