// 14 — construction line + rigidSet member: appear as [0,1] uncut (id reused), no error, but STILL cut others.
// Contrast: splitCurve errored mL51 on a rigidSet member; preTrim is silent.
import { makeSketch, addSketch, line, positions, vecApprox } from './_setup.mjs'

const info = (r, src) => { const e = r.result.find(x => x.sourceId === src); return e ? { segs: e.splittedCurves.length, iv: e.splittedCurves[0].interval, idReused: e.splittedCurves[0].id === src } : null; }

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)

  // A: construction line crossing a normal line at (50,50,0)
  const cl = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [100, 100, 0], isConstruction: true })).result
  const nl = await line(api, skId, [0, 100, 0], [100, 0, 0])
  const rA = await api.v1.sketch.preTrim({ id: skId })
  const A = { construction: info(rA, cl), normal: info(rA, nl), nMsgs: rA.messages?.length ?? 0, maxLevel: rA.maxLevel }
  console.log('[14] A construction', JSON.stringify(A.construction), '| normal', JSON.stringify(A.normal), 'msgs', A.nMsgs, 'max', A.maxLevel)

  // B: rigidSet of 2 lines + a free line crossing both at distinct interior points
  const skB = await addSketch(api, partId, planeId, 'B')
  const R1 = await line(api, skB, [0, 20, 0], [100, 20, 0])
  const R2 = await line(api, skB, [0, 60, 0], [100, 60, 0])
  const rs = (await api.v1.sketch.rigidSet({ id: skB, geomIds: [R1, R2] })).result
  const free = await line(api, skB, [50, 0, 0], [50, 100, 0]) // crosses R1 at (50,20), R2 at (50,60)
  const rB = await api.v1.sketch.preTrim({ id: skB })
  const B = { R1: info(rB, R1), R2: info(rB, R2), free: info(rB, free), nMsgs: rB.messages?.length ?? 0, maxLevel: rB.maxLevel, rigidSetId: rs }
  console.log('[14] B rigid R1', JSON.stringify(B.R1), 'R2', JSON.stringify(B.R2), '| free', JSON.stringify(B.free), 'msgs', B.nMsgs, 'max', B.maxLevel)

  filewrite({ A, B }, '14-passthrough')
  const passthrough = e => e && e.segs === 1 && JSON.stringify(e.iv) === '[0,1]' && e.idReused
  const checks = {
    A_constructionUncut: passthrough(A.construction),
    A_normalSplit: A.normal?.segs === 2,
    A_noWarning: A.maxLevel <= 31,
    B_rigidMembersUncut: passthrough(B.R1) && passthrough(B.R2),
    B_freeSplits3: B.free?.segs === 3,
    B_noRigidsetError: B.maxLevel <= 31,
  }
  console.log('[14] CHECKS', JSON.stringify(checks))
  console.log('[14]', Object.values(checks).every(Boolean) ? 'PASS' : 'see data')
  return { checks }
}
