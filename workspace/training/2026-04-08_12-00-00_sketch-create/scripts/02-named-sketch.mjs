// Test: sketch.create with custom name
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SketchTest' })).result
  console.log('[02] partId:', partId)

  const r = await api.v1.sketch.create({ id: partId, name: 'MyCustomSketch' })
  console.log('[02] sketch.create result:', r.result)
  console.log('[02] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'named-response')

  await snapshot('named-sketch')

  return { partId, sketchId: r.result }
}
