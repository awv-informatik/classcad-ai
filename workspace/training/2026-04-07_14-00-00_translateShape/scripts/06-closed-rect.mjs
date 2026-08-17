// Test: exact reproduction of script 01 — 4-line rectangle + snapshot + translate
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslateTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  // Exact same 4 lines as script 01
  const l1 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })
  const l2 = await api.v1.curve.line({ id: shapeId, startPos: [20, 0, 0], endPos: [20, 10, 0] })
  const l3 = await api.v1.curve.line({ id: shapeId, startPos: [20, 10, 0], endPos: [0, 10, 0] })
  const l4 = await api.v1.curve.line({ id: shapeId, startPos: [0, 10, 0], endPos: [0, 0, 0] })

  console.log('[06] lines:', l1.maxLevel, l2.maxLevel, l3.maxLevel, l4.maxLevel)
  console.log('[06] shapeId:', shapeId)

  await snapshot('before-translate')

  const r = await api.v1.curve.translateShape({ id: shapeId, translation: [50, 0, 0] })
  console.log('[06] translate result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'closed-rect-response')

  if (r.maxLevel <= 31) {
    await snapshot('after-translate')
  }

  return { partId, shapeId }
}
