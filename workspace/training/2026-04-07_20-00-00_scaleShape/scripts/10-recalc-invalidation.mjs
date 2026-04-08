// Test if recalc invalidates shape IDs for scaleShape (same bug as other transforms?)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 0, 0], endPos: [20, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 10, 0], endPos: [0, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 10, 0], endPos: [0, 0, 0] })

  // Call recalc to invalidate IDs
  await api.v1.common.recalc({})
  console.log('[10] recalc done, now attempting scaleShape...')

  const r = await api.v1.curve.scaleShape({ id: shapeId, factor: 2.0 })
  console.log('[10] scaleShape after recalc result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'recalc-response')

  return { partId }
}
