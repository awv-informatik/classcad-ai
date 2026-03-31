// 13 — What is the 'consumed' member on shapes? Test if it changes.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'ConsumedTest' })).result

  // Check consumed before adding curves
  const r1 = await api.v1.common.getAppVersion({})
  const before = r1.structure.tree[String(shapeId)]?.members?.consumed
  console.log('[13] consumed before curves:', JSON.stringify(before))

  // Add a curve
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const r2 = await api.v1.common.getAppVersion({})
  const afterCurve = r2.structure.tree[String(shapeId)]?.members?.consumed
  console.log('[13] consumed after curve:', JSON.stringify(afterCurve))

  // Clean it
  await api.v1.curve.cleanShape({ ids: [shapeId] })
  const r3 = await api.v1.common.getAppVersion({})
  const afterClean = r3.structure.tree[String(shapeId)]?.members?.consumed
  console.log('[13] consumed after clean:', JSON.stringify(afterClean))

  filewrite({ before, afterCurve, afterClean }, 'consumed-member')

  return {}
}
