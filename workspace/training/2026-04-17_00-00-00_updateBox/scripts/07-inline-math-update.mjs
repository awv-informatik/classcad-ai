export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', length: 80, width: 60, height: 40 })).result
  console.log('[07] boxId:', boxId)

  await snapshot('before')

  // Update with inline math expressions
  await api.v1.part.openFeature({ id: boxId })
  const upR = await api.v1.part.updateBox({ id: boxId, length: '3*25', width: 'sqrt(2500)', height: '10+20+30' })
  console.log('[07] updateBox(math) result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'math-update-response')
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after')

  return { partId, boxId }
}
