// Test various wrong ID types: string, negative, zero, null-like
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Try string ID
  try {
    const r1 = await api.v1.sketch.deleteSketch({ ids: ['not-an-id'] })
    console.log('[11] string id result:', r1.result, 'maxLevel:', r1.maxLevel)
    console.log('[11] string messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'string-id-response')
  } catch (e) {
    console.log('[11] string id threw:', e.message)
  }

  // Try 0
  const r2 = await api.v1.sketch.deleteSketch({ ids: [0] })
  console.log('[11] zero id result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[11] zero messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'zero-id-response')

  // Try negative
  const r3 = await api.v1.sketch.deleteSketch({ ids: [-1] })
  console.log('[11] negative id result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[11] negative messages:', JSON.stringify(r3.messages))

  // Try missing ids param entirely
  try {
    const r4 = await api.v1.sketch.deleteSketch({})
    console.log('[11] no ids result:', r4.result, 'maxLevel:', r4.maxLevel)
    console.log('[11] no ids messages:', JSON.stringify(r4.messages))
    filewrite({ result: r4.result, messages: r4.messages, maxLevel: r4.maxLevel }, 'no-ids-response')
  } catch (e) {
    console.log('[11] no ids threw:', e.message)
  }

  return { partId }
}
