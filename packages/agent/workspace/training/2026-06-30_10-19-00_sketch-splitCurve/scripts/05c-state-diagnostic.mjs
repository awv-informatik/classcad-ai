// 05c — diagnose the VOID-id state quirk. NO splitCurve. Two regimes:
//  (A) multiple part.create per run (each followed by sketch.create)
//  (B) one part, multiple sketch.create
import { firstError } from './_setup.mjs'

export default async function (api, { filewrite }) {
  const log = []

  // Regime A: 3x part.create + sketch.create
  for (let i = 0; i < 3; i++) {
    const partR = await api.v1.part.create({ name: 'A' + i })
    const partId = partR.result
    const treeSize = partR.structure?.tree ? Object.keys(partR.structure.tree).length : null
    const wp = partR.structure?.tree ? Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top') : null
    const skR = await api.v1.sketch.create({ id: partId, planeId: wp?.id, name: 'S' })
    const row = { regime: 'A', i, partId, treeSize, topId: wp?.id, skId: skR.result, skMax: skR.maxLevel, skErr: firstError(skR) }
    console.log('[05c]', JSON.stringify(row))
    log.push(row)
  }

  // Regime B: one fresh part, 3x sketch.create on it
  const partR = await api.v1.part.create({ name: 'B' })
  const partId = partR.result
  const wp = Object.values(partR.structure.tree).find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  for (let i = 0; i < 3; i++) {
    const skR = await api.v1.sketch.create({ id: partId, planeId: wp?.id, name: 'B' + i })
    const row = { regime: 'B', i, partId, topId: wp?.id, skId: skR.result, skMax: skR.maxLevel, skErr: firstError(skR) }
    console.log('[05c]', JSON.stringify(row))
    log.push(row)
  }

  filewrite(log, '05c-state')
  return { log }
}
