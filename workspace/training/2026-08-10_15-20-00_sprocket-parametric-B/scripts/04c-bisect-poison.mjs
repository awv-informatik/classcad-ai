/** 04c — bisect which sketch poisons later Front-plane @expr dims. */
import { EXPRESSIONS, buildParametricToothSketch } from './_sketchB.mjs'
import { BODY_EXPRESSIONS } from './_buildB.mjs'

export default async function (api, { filewrite }) {
  const mkScrew = async (partId, planeId, tag) => {
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

  const out = {}
  // case 1: expressions + TOOTH sketch only → Front screw
  {
    const partR = await api.v1.part.create({ name: 'Bisect1' })
    const partId = partR.result
    const find = (n) => Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === n).id
    await api.v1.part.expression({ id: partId, toCreate: [...EXPRESSIONS, ...BODY_EXPRESSIONS] })
    const t = await buildParametricToothSketch(api, partId, find('Right'), { seedN: 21, perturb: true })
    out.afterTooth = { toothError: t.error ?? null, screwFrontDims: await mkScrew(partId, find('Front'), 'A') }
    console.log('[04c] tooth → Front screw dims:', out.afterTooth.screwFrontDims)
  }
  await api.v1.common.clear({})
  // case 2: expressions only → Front screw
  {
    const partR = await api.v1.part.create({ name: 'Bisect2' })
    const partId = partR.result
    const find = (n) => Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === n).id
    await api.v1.part.expression({ id: partId, toCreate: [...EXPRESSIONS, ...BODY_EXPRESSIONS] })
    out.exprOnly = { screwFrontDims: await mkScrew(partId, find('Front'), 'B') }
    console.log('[04c] expressions only → Front screw dims:', out.exprOnly.screwFrontDims)
  }
  await api.v1.common.clear({})
  // case 3: expressions only → TOP screw then FRONT screw (mimic build pairing)
  {
    const partR = await api.v1.part.create({ name: 'Bisect3' })
    const partId = partR.result
    const find = (n) => Object.values(partR.structure.tree).find((o) => o.class === 'CC_WorkPlane' && o.name === n).id
    await api.v1.part.expression({ id: partId, toCreate: [...EXPRESSIONS, ...BODY_EXPRESSIONS] })
    const top = await mkScrew(partId, find('Top'), 'C1')
    const front = await mkScrew(partId, find('Front'), 'C2')
    out.topThenFront = { top, front }
    console.log('[04c] Top screw → Front screw dims:', top, front)
  }
  filewrite(out, 'bisect')
  return out
}
