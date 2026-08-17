// 01 — Basic shape creation with default and custom name
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EI' })).result
  console.log('[01] partId:', partId, 'eifId:', eifId)

  // Create shape with default name
  const r1 = await api.v1.curve.shape({ id: eifId })
  console.log('[01] default shape result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[01] messages:', JSON.stringify(r1.messages))

  // Create shape with custom name
  const r2 = await api.v1.curve.shape({ id: eifId, name: 'MyShape' })
  console.log('[01] named shape result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({ r1: { result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, r2: { result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel } }, 'shape-responses')

  // Dump structure to see where shapes live in the tree
  filewrite(r2.structure, 'structure-after-two-shapes')

  await snapshot('two-shapes')

  return { partId, eifId, shape1: r1.result, shape2: r2.result }
}
