// Test basic translateShape along X axis
// Question: Does it modify in-place? What does the return look like?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslateTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  // Create a simple rectangle at origin
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 0, 0], endPos: [20, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 10, 0], endPos: [0, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 10, 0], endPos: [0, 0, 0] })

  await snapshot('before-translate')

  // Translate along X by 50
  const r = await api.v1.curve.translateShape({ id: shapeId, translation: [50, 0, 0] })
  console.log('[01] translateShape result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'translate-response')

  await snapshot('after-translate-x50')

  return { partId, shapeId }
}
