/** 04e — bisect round 3: TAPER sketch → Top screw → Front screw. */
import { EXPRESSIONS } from './_sketchB.mjs'
import { BODY_EXPRESSIONS } from './_buildB.mjs'

const mkScrew = async (api, partId, planeId, tag) => {
  const sk = (await api.v1.sketch.create({ id: partId, planeId, name: `Scr${tag}` })).result
  const sO = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0] })).result
  const hL = (await api.v1.sketch.line({ id: sk, startPos: [0, 0, 0], endPos: [40, 0, 0], isConstruction: true })).result
  const c = (await api.v1.sketch.circle({ id: sk, centerPos: [10.5, 0.2, 0], radius: 3.5 })).result
  const ctr = (await api.v1.sketch.getPoints({ id: c })).result.centerId
  await api.v1.sketch.constraint([
    { id: sk, type: 'FIXATION', geomIds: [sO] },
    { id: sk, type: 'COINCIDENT', geomIds: [sO, hL] },
    { id: sk, type: 'HORIZONTAL', geomIds: [hL] },
    { id: sk, type: 'COINCIDENT', geomIds: [ctr, hL] },
  ])
  const d = await api.v1.sketch.dimension([
    { id: sk, name: `p${tag}`, type: 'HORIZONTAL_DISTANCE', geomIds: [sO, ctr], value: '@expr.screwVmm' },
    { id: sk, name: `d${tag}`, type: 'DIAMETER', geomIds: [c], value: '@expr.screwDmm' },
  ])
  return d.maxLevel
}

const mkBlank = async (api, partId, planeId) => {
  const skB = (await api.v1.sketch.create({ id: partId, planeId, name: 'BlankSection' })).result
  const t1s = 4.4, Rs = 35.2, hRs = 27.1, Ls = 17.4
  const gB = await api.v1.sketch.geometry({
    id: skB,
    lines: [
      { startPos: [0, 0, 0], endPos: [0, Rs, 0] },
      { startPos: [0, Rs, 0], endPos: [t1s, Rs, 0] },
      { startPos: [t1s, Rs, 0], endPos: [t1s, hRs, 0] },
      { startPos: [t1s, hRs, 0], endPos: [Ls, hRs, 0] },
      { startPos: [Ls, hRs, 0], endPos: [Ls, 0, 0] },
      { startPos: [Ls, 0, 0], endPos: [0, 0, 0] },
    ],
    genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
  })
  const BL = gB.result.lines
  const bp = []
  for (const id of BL) bp.push((await api.v1.sketch.getPoints({ id })).result)
  await api.v1.sketch.constraint([
    { id: skB, type: 'FIXATION', geomIds: [bp[0].startId] },
    ...BL.map((id, i) => ({ id: skB, type: 'COINCIDENT', geomIds: [bp[i].endId, bp[(i + 1) % 6].startId] })),
    { id: skB, type: 'VERTICAL', geomIds: [BL[0]] },
    { id: skB, type: 'HORIZONTAL', geomIds: [BL[1]] },
    { id: skB, type: 'VERTICAL', geomIds: [BL[2]] },
    { id: skB, type: 'HORIZONTAL', geomIds: [BL[3]] },
    { id: skB, type: 'VERTICAL', geomIds: [BL[4]] },
    { id: skB, type: 'HORIZONTAL', geomIds: [BL[5]] },
  ])
  const dB = await api.v1.sketch.dimension([
    { id: skB, name: 'bBlankR', type: 'OFFSET', geomIds: [BL[0]], value: '@expr.blankR' },
    { id: skB, name: 'bT1', type: 'OFFSET', geomIds: [BL[1]], value: '@expr.t1mm' },
    { id: skB, name: 'bHubR', type: 'VERTICAL_DISTANCE', geomIds: [bp[0].startId, bp[3].startId], value: '@expr.hubRmm' },
    { id: skB, name: 'bLTB', type: 'HORIZONTAL_DISTANCE', geomIds: [bp[0].startId, bp[4].startId], value: '@expr.LTBmm' },
  ])
  return dB.maxLevel
}


export default async function (api, { filewrite }) {
  const out = {}
  const partR = await api.v1.part.create({ name: 'BisTaper' })
  const partId = partR.result
  const find = (n) => Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === n).id
  await api.v1.part.expression({ id: partId, toCreate: [...EXPRESSIONS, ...BODY_EXPRESSIONS] })

  // taper sketch exactly as in _buildB
  const skTap = (await api.v1.sketch.create({ id: partId, planeId: find('Top'), name: 'TaperSection' })).result
  const tapO = (await api.v1.sketch.point({ id: skTap, pos: [0, 0, 0] })).result
  const vLine = (await api.v1.sketch.line({ id: skTap, startPos: [0, 0, 0], endPos: [0, 45, 0], isConstruction: true })).result
  await api.v1.sketch.constraint([
    { id: skTap, type: 'FIXATION', geomIds: [tapO] },
    { id: skTap, type: 'COINCIDENT', geomIds: [tapO, vLine] },
    { id: skTap, type: 'VERTICAL', geomIds: [vLine] },
  ])
  const seeds = [
    [[0, 29.5], [0, 36.9], [1.9, 36.9]],
    [[4.3, 29.5], [4.3, 36.9], [2.4, 36.9]],
  ]
  for (const [t, tri] of seeds.entries()) {
    const gT = await api.v1.sketch.geometry({
      id: skTap,
      lines: [0, 1, 2].map((i) => ({
        startPos: [tri[i][0], tri[i][1], 0], endPos: [tri[(i + 1) % 3][0], tri[(i + 1) % 3][1], 0],
      })),
      genFixation: false, genIncidence: false, genTangency: false, genVertAndHoriz: false,
    })
    const TL = gT.result.lines
    const tp = []
    for (const id of TL) tp.push((await api.v1.sketch.getPoints({ id })).result)
    const cons = [
      ...TL.map((id, i) => ({ id: skTap, type: 'COINCIDENT', geomIds: [tp[i].endId, tp[(i + 1) % 3].startId] })),
      { id: skTap, type: 'VERTICAL', geomIds: [TL[0]] },
      { id: skTap, type: 'HORIZONTAL', geomIds: [TL[1]] },
    ]
    if (t === 0) cons.push({ id: skTap, type: 'COINCIDENT', geomIds: [tp[0].startId, vLine] })
    const cR = await api.v1.sketch.constraint(cons)
    const dimsT = [
      { id: skTap, name: `tApexR${t}`, type: 'VERTICAL_DISTANCE', geomIds: [tapO, tp[0].startId], value: '@expr.taperR0' },
      { id: skTap, name: `tR1_${t}`, type: 'VERTICAL_DISTANCE', geomIds: [tapO, tp[1].startId], value: '@expr.taperR1' },
      { id: skTap, name: `tDz${t}`, type: 'HORIZONTAL_DISTANCE', geomIds: [tp[1].startId, tp[2].startId], value: '@expr.taperDz' },
    ]
    if (t === 1) dimsT.push({ id: skTap, name: 'tBackV', type: 'HORIZONTAL_DISTANCE', geomIds: [tapO, tp[0].startId], value: '@expr.t1mm' })
    const dR = await api.v1.sketch.dimension(dimsT)
    console.log(`[04e] taper${t}: cons ${cR.maxLevel} dims ${dR.maxLevel}`, JSON.stringify((dR.messages ?? []).map((m) => m.message)))
    out[`taper${t}`] = { cons: cR.maxLevel, dims: dR.maxLevel }
  }
  out.screwTop = await mkScrew(api, partId, find('Top'), 'T')
  out.screwFront = await mkScrew(api, partId, find('Front'), 'F')
  console.log('[04e] screws Top/Front:', out.screwTop, out.screwFront)
  filewrite(out, 'bisect3')
  return out
}
