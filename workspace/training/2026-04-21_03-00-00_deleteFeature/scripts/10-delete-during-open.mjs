export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 20, height: 60, position: [50, 0, 0] })).result
  console.log('[10] boxId:', boxId, 'cylId:', cylId)

  // Open the box for editing
  const openR = await api.v1.part.openFeature({ id: boxId })
  console.log('[10] openFeature box — maxLevel:', openR.maxLevel)

  // Try to delete the cylinder while box is open
  const r1 = await api.v1.part.deleteFeature({ ids: [cylId] })
  console.log('[10] delete cyl while box open — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[10] messages:', JSON.stringify(r1.messages))

  // Try to delete the opened feature itself
  const r2 = await api.v1.part.deleteFeature({ ids: [boxId] })
  console.log('[10] delete opened box — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] messages:', JSON.stringify(r2.messages))

  // Close
  const closeR = await api.v1.part.closeFeature({ id: partId })
  console.log('[10] closeFeature — maxLevel:', closeR.maxLevel)

  await snapshot('after')

  filewrite({
    deleteCylWhileOpen: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    deleteOpenedBox: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
  }, 'open-interaction')

  return { partId }
}
