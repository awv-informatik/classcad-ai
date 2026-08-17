// 01 — Basic merge of two overlapping boxes. Capture result, structure, and snapshot.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MergeBasic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Two overlapping boxes
  const box1 = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, 0]
  })).result

  console.log('[01] box1:', box1, 'box2:', box2)

  await snapshot('before-merge')

  const r = await api.v1.solid.merge({ id: eifId, target: box1, tools: [box2] })
  console.log('[01] merge result:', r.result)
  console.log('[01] merge maxLevel:', r.maxLevel)
  console.log('[01] merge messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'merge-response')

  await snapshot('after-merge')

  // Dump structure to see what's in the drawing after merge
  filewrite(r.structure, 'after-merge-structure')

  // Check if box2 is still valid by trying to get its graphic data
  // (If consumed like union, this would fail)
  try {
    const copyR = await api.v1.solid.copy({ id: eifId, solid: box2 })
    console.log('[01] copy box2 after merge — result:', copyR.result, 'maxLevel:', copyR.maxLevel)
  } catch (e) {
    console.log('[01] copy box2 after merge — error:', e.message)
  }

  return { partId, eifId }
}
