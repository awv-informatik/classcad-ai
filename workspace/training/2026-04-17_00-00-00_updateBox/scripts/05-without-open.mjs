export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[05] boxId:', boxId)

  // Try updateBox WITHOUT openFeature — should fail
  const upR = await api.v1.part.updateBox({ id: boxId, height: 200 })
  console.log('[05] updateBox without open — result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'without-open-response')

  return { partId, boxId }
}
