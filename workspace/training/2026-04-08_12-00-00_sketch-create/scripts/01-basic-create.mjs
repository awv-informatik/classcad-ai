// Test: basic sketch.create with only required param (part ID)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result
  console.log('[01] partId:', partId)

  const r = await api.v1.sketch.create({ id: partId })
  console.log('[01] sketch.create result:', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'create-response')

  // Check what the structure tree looks like with a sketch
  filewrite(r.structure, 'structure-after-create')

  await snapshot('basic-sketch')

  return { partId, sketchId: r.result }
}
