// Test: updateWorkAxis — change position and direction (with openFeature)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const waId = (await api.v1.part.workAxis({
    id: partId,
    name: 'WA_test',
    position: [0, 0, 0],
    direction: [1, 0, 0]
  })).result
  console.log('[09] created waId:', waId)

  // Open the feature for editing
  await api.v1.part.openFeature({ id: waId })

  // Update position only
  const r1 = await api.v1.part.updateWorkAxis({ id: waId, position: [40, 30, 20] })
  console.log('[09] update pos result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'update-pos')

  // Update direction only (still in same open session)
  const r2 = await api.v1.part.updateWorkAxis({ id: waId, direction: [0, 0, 1] })
  console.log('[09] update dir result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'update-dir')

  // Update both
  const r3 = await api.v1.part.updateWorkAxis({ id: waId, position: [10, 10, 10], direction: [1, 1, 0] })
  console.log('[09] update both result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'update-both')

  await api.v1.part.closeFeature({ id: waId })

  await snapshot('after-update')
  return { partId }
}
