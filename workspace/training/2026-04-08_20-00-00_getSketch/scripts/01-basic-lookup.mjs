// Test basic getSketch — look up a named sketch
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GetSketchTest' })).result
  console.log('[01] partId:', partId)

  // Create a named sketch
  const skId = (await api.v1.part.sketch({ id: partId, name: 'MySketch' })).result
  console.log('[01] created sketch id:', skId)

  // Look it up by name
  const r = await api.v1.part.getSketch({ id: partId, name: 'MySketch' })
  console.log('[01] getSketch result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] match:', r.result === skId)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages, createdId: skId, match: r.result === skId }, 'response')

  return { partId, skId, foundId: r.result }
}
