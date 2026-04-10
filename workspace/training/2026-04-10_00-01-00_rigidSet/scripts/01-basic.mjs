// 01 — Basic rigidSet creation with two lines
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RigidSetTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two lines
  const line1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })).result
  const line2 = (await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0] })).result

  console.log('[01] line1:', line1)
  console.log('[01] line2:', line2)

  // Create rigid set
  const r = await api.v1.sketch.rigidSet({ id: skId, geomIds: [line1, line2] })
  console.log('[01] rigidSet result:', r.result)
  console.log('[01] rigidSet maxLevel:', r.maxLevel)
  console.log('[01] rigidSet messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rigidset-response')

  await snapshot('basic')
  return { partId, skId, rigidSetId: r.result }
}
