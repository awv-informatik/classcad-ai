// 02 — updateDimension on RADIUS and DIAMETER dimensions
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a circle
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [40, 40, 0], radius: 20 })).result
  console.log('[02] circId:', circId)

  // Create RADIUS dimension
  const radDimId = (await api.v1.sketch.dimension({ id: skId, type: 'RADIUS', geomIds: [circId] })).result
  console.log('[02] radDimId:', radDimId)

  // Update RADIUS to 35
  const r1 = await api.v1.sketch.updateDimension({ id: radDimId, value: 35 })
  console.log('[02] RADIUS update result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'radius-update')

  // Create another circle for DIAMETER
  const circ2 = (await api.v1.sketch.circle({ id: skId, centerPos: [120, 40, 0], radius: 15 })).result
  const diaDimId = (await api.v1.sketch.dimension({ id: skId, type: 'DIAMETER', geomIds: [circ2] })).result
  console.log('[02] diaDimId:', diaDimId)

  // Update DIAMETER to 50
  const r2 = await api.v1.sketch.updateDimension({ id: diaDimId, value: 50 })
  console.log('[02] DIAMETER update result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'diameter-update')

  await snapshot('after-updates')
  return { partId }
}
