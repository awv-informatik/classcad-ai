// Verify copy independence: modify original, check copy is unaffected
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyIndep' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a box and copy it
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const copyId = (await api.v1.solid.copy({ id: eifId, target: boxId, translation: [80, 0, 0] })).result

  // Get graphic data before modifying original
  const beforeR = await api.v1.common.getAppVersion({})
  filewrite(beforeR.graphic, 'graphic-before-modify')

  await snapshot('before-modify')

  // Now subtract a cylinder from the ORIGINAL only
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 25, translation: [30, 20, -10] })).result
  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cylId] })

  await snapshot('after-modify-original')

  // The copy should still be an intact box
  // Get graphic data after modification
  const afterR = await api.v1.common.getAppVersion({})
  filewrite(afterR.graphic, 'graphic-after-modify')

  console.log('[09] boxId:', boxId, 'copyId:', copyId)
  console.log('[09] If copy is independent, after-snapshot should show: hole in original, intact copy')

  return { partId, eifId, boxId, copyId }
}
