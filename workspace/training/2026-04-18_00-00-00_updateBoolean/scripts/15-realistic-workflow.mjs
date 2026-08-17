export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Bracket' })).result

  // Create bracket body
  const plate = (await api.v1.part.box({ id: partId, name: 'Plate', length: 120, width: 80, height: 10 })).result
  const riser = (await api.v1.part.box({ id: partId, name: 'Riser', length: 15, width: 60, height: 60, translation: [0, 10, 10] })).result

  // First: union plate + riser
  const bodyId = (await api.v1.part.boolean({
    id: partId, type: 'UNION', name: 'Body', target: plate, tools: [riser],
  })).result
  console.log('[15] body union:', bodyId)

  // Create a mounting hole
  const hole = (await api.v1.part.cylinder({ id: partId, name: 'MountHole', diameter: 12, height: 20, translation: [80, 40, -5] })).result

  // Subtract hole
  const withHole = (await api.v1.part.boolean({
    id: partId, type: 'SUBTRACTION', name: 'WithHole', target: bodyId, tools: [hole],
  })).result
  console.log('[15] with hole:', withHole)

  await snapshot('initial-subtraction')

  // Oops, should have been a slot not a hole — change tool
  const slot = (await api.v1.part.box({ id: partId, name: 'Slot', length: 30, width: 8, height: 20, translation: [65, 36, -5] })).result

  await api.v1.part.openFeature({ id: withHole })
  const updateR = await api.v1.part.updateBoolean({ id: withHole, tools: [slot] })
  console.log('[15] updated to slot:', updateR.result, 'maxLevel:', updateR.maxLevel)
  filewrite({ result: updateR.result, messages: updateR.messages, maxLevel: updateR.maxLevel }, 'realistic-response')
  await api.v1.part.closeFeature({ id: withHole })

  await snapshot('updated-to-slot')

  return { partId, withHole }
}
