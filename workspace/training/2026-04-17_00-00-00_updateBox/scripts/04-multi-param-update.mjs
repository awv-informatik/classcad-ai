export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', length: 80, width: 60, height: 40 })).result
  console.log('[04] boxId:', boxId)

  await snapshot('before')

  // Update all three dimensions at once
  await api.v1.part.openFeature({ id: boxId })
  const upR = await api.v1.part.updateBox({ id: boxId, length: 40, width: 100, height: 80 })
  console.log('[04] updateBox(l=40,w=100,h=80) result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'multi-param-response')
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after')

  return { partId, boxId }
}
