// 06 — keepIds: what survives when keeping part? Do children survive?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Survive' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  // Create an expression too
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'W', value: 42 }] })

  console.log('[06] before clear — partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Keep the part
  await api.v1.common.clear({ keepIds: [partId] })
  console.log('[06] cleared with keepIds=[partId]')

  // Check what's alive
  // 1. Can we read the expression?
  const exprR = await api.v1.part.getExpression({ id: partId, name: 'W' })
  console.log('[06] expression W:', exprR.result, 'maxLevel:', exprR.maxLevel)

  // 2. Can we create new geometry inside the kept part?
  const eifId2 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF2' })).result
  console.log('[06] new eifId2:', eifId2)

  const boxId2 = (await api.v1.solid.box({ id: eifId2, length: 30, width: 30, height: 30 })).result
  console.log('[06] new boxId2:', boxId2)

  // 3. Can we access the old eifId?
  const oldBoxCopy = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [0, 60, 0] })
  console.log('[06] copy from old eifId — result:', oldBoxCopy.result, 'maxLevel:', oldBoxCopy.maxLevel)

  return { partId, eifId2, boxId2 }
}
