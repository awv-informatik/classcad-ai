// Test: does snapshot before translateShape break things?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslateTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  // Create a rectangle
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 0, 0], endPos: [20, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [20, 10, 0], endPos: [0, 10, 0] })
  await api.v1.curve.line({ id: shapeId, startPos: [0, 10, 0], endPos: [0, 0, 0] })

  // NO snapshot before — translate directly
  const r = await api.v1.curve.translateShape({ id: shapeId, translation: [50, 0, 0] })
  console.log('[04] translate result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-pre-snap-response')

  await snapshot('after-translate')

  return { partId, shapeId }
}
