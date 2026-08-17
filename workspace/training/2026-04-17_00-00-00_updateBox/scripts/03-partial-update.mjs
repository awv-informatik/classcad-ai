export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  // Create a reference box that won't change, to show scale differences
  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', length: 80, width: 60, height: 40 })).result
  console.log('[03] refBoxId:', refBoxId, 'boxId:', boxId)

  await snapshot('before')

  // Update ONLY width — length and height should stay the same
  await api.v1.part.openFeature({ id: boxId })
  const upR = await api.v1.part.updateBox({ id: boxId, width: 120 })
  console.log('[03] updateBox(width=120) result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'partial-response')
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after')

  return { partId, boxId, refBoxId }
}
