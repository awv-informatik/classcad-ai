export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OrderTest' })).result

  // Create ALL features BEFORE the boolean
  const plate = (await api.v1.part.box({ id: partId, name: 'Plate', length: 120, width: 80, height: 10 })).result
  const riser = (await api.v1.part.box({ id: partId, name: 'Riser', length: 15, width: 60, height: 60, translation: [0, 10, 10] })).result

  const bodyId = (await api.v1.part.boolean({
    id: partId, type: 'UNION', name: 'Body', target: plate, tools: [riser],
  })).result

  // Create hole AND slot BEFORE the subtraction boolean
  const hole = (await api.v1.part.cylinder({ id: partId, name: 'MountHole', diameter: 12, height: 20, translation: [80, 40, -5] })).result
  const slot = (await api.v1.part.box({ id: partId, name: 'Slot', length: 30, width: 8, height: 20, translation: [65, 36, -5] })).result

  // Subtract hole first
  const subId = (await api.v1.part.boolean({
    id: partId, type: 'SUBTRACTION', name: 'WithCut', target: bodyId, tools: [hole],
  })).result
  console.log('[16] subtraction created:', subId)

  await snapshot('with-hole')

  // Now update to use slot instead of hole — slot was created before the boolean
  await api.v1.part.openFeature({ id: subId })
  const updateR = await api.v1.part.updateBoolean({ id: subId, tools: [slot] })
  console.log('[16] updateBoolean to slot:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'ordering-response')
  await api.v1.part.closeFeature({ id: subId })

  await snapshot('with-slot')

  return { partId, subId }
}
