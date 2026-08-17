// 01 — Basic union of two overlapping boxes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UnionBasic' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box 1: large base box at origin
  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 60, height: 40
  })).result
  console.log('[01] box1:', box1)

  // Box 2: smaller box overlapping corner, offset in X and Y
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, 0]
  })).result
  console.log('[01] box2:', box2)

  await snapshot('before-union')

  // Perform union
  const r = await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })
  console.log('[01] union result:', r.result)
  console.log('[01] union maxLevel:', r.maxLevel)
  console.log('[01] union messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'union-response')

  await snapshot('after-union')

  return { partId, eifId, box1, box2, unionResult: r.result }
}
