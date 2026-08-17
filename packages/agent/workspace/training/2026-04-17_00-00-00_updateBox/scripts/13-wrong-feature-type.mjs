export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 30, height: 60 })).result
  console.log('[13] cylId:', cylId)

  // Try updateBox on a cylinder feature
  await api.v1.part.openFeature({ id: cylId })
  const upR = await api.v1.part.updateBox({ id: cylId, height: 200 })
  console.log('[13] updateBox on cylinder — result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'wrong-type-response')
  await api.v1.part.closeFeature({ id: cylId })

  return { partId, cylId }
}
