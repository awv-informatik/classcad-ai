// Test fillet with radius parameter
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletRadius' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 60, 0] })
  const lineIds = rect.result

  // Fillet with radius=15
  const r = await api.v1.sketch.fillet({ id: skId, lineIds: [lineIds[0], lineIds[1]], radius: 15 })
  console.log('[02] fillet result:', JSON.stringify(r.result))
  console.log('[02] fillet maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fillet-radius-response')
  await snapshot('radius-fillet')

  return { partId, filletResult: r.result }
}
