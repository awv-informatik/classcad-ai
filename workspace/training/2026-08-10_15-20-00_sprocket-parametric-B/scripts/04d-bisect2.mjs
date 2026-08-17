/** 04d — bisect round 2: blank+taper (Top sketches) vs bore+key (Right sketches). */
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
  // case A: blank (Top) → Front screw
  {
    const partR = await api.v1.part.create({ name: 'BisA' })
    const partId = partR.result
    const find = (n) => Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === n).id
    await api.v1.part.expression({ id: partId, toCreate: [...EXPRESSIONS, ...BODY_EXPRESSIONS] })
    const b = await mkBlank(api, partId, find('Top'))
    out.blankThenFront = { blankDims: b, front: await mkScrew(api, partId, find('Front'), 'A') }
    console.log('[04d] blank → Front screw:', JSON.stringify(out.blankThenFront))
  }
  await api.v1.common.clear({})
  // case B: bore+key (Right) → Front screw
  {
    const partR = await api.v1.part.create({ name: 'BisB' })
    const partId = partR.result
    const find = (n) => Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === n).id
    await api.v1.part.expression({ id: partId, toCreate: [...EXPRESSIONS, ...BODY_EXPRESSIONS] })
    const skBore = (await api.v1.sketch.create({ id: partId, planeId: find('Right'), name: 'BoreSketch' })).result
    const pO2 = (await api.v1.sketch.point({ id: skBore, pos: [0, 0, 0] })).result
    const boreC = (await api.v1.sketch.circle({ id: skBore, centerPos: [0.3, -0.2, 0], radius: 11 })).result
    await api.v1.sketch.constraint([
      { id: skBore, type: 'FIXATION', geomIds: [pO2] },
      { id: skBore, type: 'COINCIDENT', geomIds: [(await api.v1.sketch.getPoints({ id: boreC })).result.centerId, pO2] },
    ])
    const d1 = await api.v1.sketch.dimension({ id: skBore, name: 'dBore', type: 'DIAMETER', geomIds: [boreC], value: '@expr.boreDmm' })
    const skKey = (await api.v1.sketch.create({ id: partId, planeId: find('Right'), name: 'KeywaySketch' })).result
    const pO3 = (await api.v1.sketch.point({ id: skKey, pos: [0, 0, 0] })).result
    const kw = (await api.v1.sketch.rectangle({ id: skKey, startPos: [-3.3, 11.3, 0], endPos: [3.2, 15.0, 0] })).result
    const kp = []
    for (const id of kw) kp.push((await api.v1.sketch.getPoints({ id })).result)
    await api.v1.sketch.constraint([
      { id: skKey, type: 'FIXATION', geomIds: [pO3] },
      { id: skKey, type: 'HORIZONTAL', geomIds: [kw[0]] },
      { id: skKey, type: 'HORIZONTAL', geomIds: [kw[2]] },
      { id: skKey, type: 'VERTICAL', geomIds: [kw[1]] },
      { id: skKey, type: 'VERTICAL', geomIds: [kw[3]] },
    ])
    const d2 = await api.v1.sketch.dimension([
      { id: skKey, name: 'kW', type: 'OFFSET', geomIds: [kw[0]], value: '@expr.kwWmm' },
      { id: skKey, name: 'kH', type: 'OFFSET', geomIds: [kw[1]], value: '@expr.kwHmm' },
      { id: skKey, name: 'kX', type: 'HORIZONTAL_DISTANCE', geomIds: [pO3, kp[0].startId], value: '@expr.kwW2mm' },
      { id: skKey, name: 'kY', type: 'VERTICAL_DISTANCE', geomIds: [pO3, kp[0].startId], value: '@expr.kwY0mm' },
    ])
    out.boreKeyThenFront = { boreDim: d1.maxLevel, keyDims: d2.maxLevel, front: await mkScrew(api, partId, find('Front'), 'B') }
    console.log('[04d] bore+key → Front screw:', JSON.stringify(out.boreKeyThenFront))
  }
  filewrite(out, 'bisect2')
  return out
}
