// 02 — Move a circle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 30, 0], radius: 15 })).result
  console.log('[02] circId:', circId)

  // Get center via getPoints -> getPositions workaround
  const pts = (await api.v1.sketch.getPoints({ id: circId })).result
  const beforeCenter = (await api.v1.sketch.getPositions({ id: pts.centerId })).result
  console.log('[02] before center:', JSON.stringify(beforeCenter))

  await snapshot('before')

  const r = await api.v1.sketch.moveGeometry({ id: skId, geomIds: [circId], translation: [25, -10, 0] })
  console.log('[02] moveGeometry result:', r.result, 'maxLevel:', r.maxLevel)

  const afterCenter = (await api.v1.sketch.getPositions({ id: pts.centerId })).result
  console.log('[02] after center:', JSON.stringify(afterCenter))

  filewrite({ beforeCenter, afterCenter, moveResult: r.result, maxLevel: r.maxLevel }, 'move-circle-result')

  await snapshot('after')

  return { partId }
}
