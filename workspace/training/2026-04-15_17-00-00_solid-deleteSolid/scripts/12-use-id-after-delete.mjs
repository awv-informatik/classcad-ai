// Test: try to use a deleted solid's ID in subsequent operations
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UseAfterDelete' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 50, translation: [80, 0, 0] })).result
  console.log('[12] boxId:', boxId, 'box2:', box2)

  // Delete boxId
  await api.v1.solid.deleteSolid({ id: eifId, ids: [boxId] })
  console.log('[12] boxId deleted')

  // Try copy targeting deleted solid
  const r1 = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [0, 80, 0] })
  console.log('[12] copy deleted — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'copy-deleted')

  // Try translation on deleted solid
  const r2 = await api.v1.solid.translation({ id: eifId, target: boxId, translation: [0, 50, 0] })
  console.log('[12] translate deleted — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'translate-deleted')

  // Try subtraction using deleted solid as tool
  const r3 = await api.v1.solid.subtraction({ id: eifId, target: box2, tools: [boxId] })
  console.log('[12] subtract with deleted tool — result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'subtract-deleted-tool')

  await snapshot('after-use-deleted')

  return { partId, eifId }
}
