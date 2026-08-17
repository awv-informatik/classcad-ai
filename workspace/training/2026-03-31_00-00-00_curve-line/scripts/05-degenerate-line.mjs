export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Degenerate' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Degen' })).result

  // Degenerate line: start == end
  const r = await api.v1.curve.line({ id: shapeId, startPos: [10, 10, 0], endPos: [10, 10, 0] })
  console.log('[05] degenerate result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'degenerate-response')

  // Also try very short line (nearly degenerate)
  const r2 = await api.v1.curve.line({ id: shapeId, startPos: [0, 0, 0], endPos: [0.001, 0, 0] })
  console.log('[05] near-degenerate result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[05] near-degenerate messages:', JSON.stringify(r2.messages))

  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'near-degenerate-response')

  await snapshot('degenerate')
  return { partId, shapeId }
}
