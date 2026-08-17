// 10 — Does recalc invalidate shape IDs for rotateShape (like translateShape)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Test' })).result

  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 10, 0] })

  // Call recalc
  await api.v1.common.recalc({})
  console.log('[10] recalc done')

  // Try to rotate after recalc
  const r = await api.v1.curve.rotateShape({ id: shapeId, rotation: [0, 0, Math.PI / 4] })
  console.log('[10] after recalc — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] after recalc — messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'recalc-response')

  return { partId }
}
