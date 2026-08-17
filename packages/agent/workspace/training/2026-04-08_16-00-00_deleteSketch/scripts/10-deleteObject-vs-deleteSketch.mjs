// Can deleteObject delete a whole sketch? Or is it only for sketch sub-objects?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'TestObj' })).result
  console.log('[10] sketch:', skId)

  // Try deleteObject with the sketch ID
  const r = await api.v1.sketch.deleteObject({ ids: [skId] })
  console.log('[10] deleteObject(sketchId) result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[10] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'deleteObject-sketch-response')

  // Check if sketch still exists
  const check = await api.v1.part.getSketch({ id: partId, name: 'TestObj' })
  console.log('[10] getSketch after deleteObject:', check.result, 'maxLevel:', check.maxLevel)
  console.log('[10] sketch still exists?', check.result !== null)

  return { partId }
}
