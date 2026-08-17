// Debug: what type/value is shapeId? Does translateShape need the EI ID?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TranslateTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Rect' })).result

  console.log('[03] partId:', partId, typeof partId)
  console.log('[03] eifId:', eifId, typeof eifId)
  console.log('[03] shapeId:', shapeId, typeof shapeId)

  // Create a simple line
  await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [20, 0, 0] })

  // Try translateShape with id: shapeId (what docs say)
  const r1 = await api.v1.curve.translateShape({ id: shapeId, translation: [50, 0, 0] })
  console.log('[03] translate(shapeId) maxLevel:', r1.maxLevel, 'messages:', JSON.stringify(r1.messages))

  // Try with id: eifId
  const r2 = await api.v1.curve.translateShape({ id: eifId, translation: [50, 0, 0] })
  console.log('[03] translate(eifId) maxLevel:', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  // Try with id: partId
  const r3 = await api.v1.curve.translateShape({ id: partId, translation: [50, 0, 0] })
  console.log('[03] translate(partId) maxLevel:', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  filewrite({
    shapeId: { value: shapeId, type: typeof shapeId },
    eifId: { value: eifId, type: typeof eifId },
    partId: { value: partId, type: typeof partId },
    translateShape: r1.maxLevel,
    translateEif: r2.maxLevel,
    translatePart: r3.maxLevel,
  }, 'debug-ids')

  return { partId }
}
