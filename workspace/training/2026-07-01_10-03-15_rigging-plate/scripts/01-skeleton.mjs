// 01 — SILHOUETTE CALIBRATION. Place only the primary circles (bosses, holes, slot ends, right-lobe ends,
// left lobe). No fillets, no constraints, no trim. Snapshot to compare the union's silhouette to the drawing
// and calibrate linear placements before anything else.
import { makeSketch, circle } from './_setup.mjs'
import { M } from './_model.mjs'

export default async function (api, { snapshot, filewrite }) {
  const { skId } = await makeSketch(api, { name: 'RiggingPlate' })
  const c = (ctr, r) => circle(api, skId, [ctr[0], ctr[1], 0], r)

  // bosses (outer) + holes
  await c(M.centerBoss.c, M.centerBoss.rBoss)
  await c(M.centerBoss.c, M.centerBoss.rHole)
  await c(M.topBoss.c, M.topBoss.rBoss)
  await c(M.topBoss.c, M.topBoss.rHole)
  // left lobe + slot (obround: two end circles)
  await c(M.leftLobe.c, M.leftLobe.r)
  await c(M.slot.e1, M.slot.rEnd)
  await c(M.slot.e2, M.slot.rEnd)
  // right lobe (two end circles)
  await c(M.rightLobe.far, M.rightLobe.rEnd)
  await c(M.rightLobe.near, M.rightLobe.rEnd)

  await snapshot('01-skeleton')
  const geo = (await api.v1.sketch.getGeometry({ id: skId })).result
  filewrite({ model: M, circles: (geo.circles || []).length }, '01-skeleton')
  console.log('[01] circles', (geo.circles || []).length, '— compare silhouette to drawing')
  return { circles: (geo.circles || []).length }
}
