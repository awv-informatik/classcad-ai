export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[10] boxId:', boxId)

  // Try updating to zero height
  await api.v1.part.openFeature({ id: boxId })
  const upZero = await api.v1.part.updateBox({ id: boxId, height: 0 })
  console.log('[10] height=0 — result:', upZero.result, 'maxLevel:', upZero.maxLevel)
  filewrite({ result: upZero.result, messages: upZero.messages, maxLevel: upZero.maxLevel }, 'zero-height-response')
  await api.v1.part.closeFeature({ id: boxId })

  // Try updating to negative width
  await api.v1.part.openFeature({ id: boxId })
  const upNeg = await api.v1.part.updateBox({ id: boxId, width: -50 })
  console.log('[10] width=-50 — result:', upNeg.result, 'maxLevel:', upNeg.maxLevel)
  filewrite({ result: upNeg.result, messages: upNeg.messages, maxLevel: upNeg.maxLevel }, 'negative-width-response')
  await api.v1.part.closeFeature({ id: boxId })

  return { partId, boxId }
}
