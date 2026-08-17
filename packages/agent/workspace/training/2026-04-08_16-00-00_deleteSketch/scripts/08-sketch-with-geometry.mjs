// Test deleting a sketch that contains geometry (lines, circles, etc.)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId, name: 'GeoSketch' })).result
  console.log('[08] sketch:', skId)

  // Add geometry to the sketch
  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  console.log('[08] rectangle result:', rect.result, 'maxLevel:', rect.maxLevel)

  const line = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [40, 25, 0] })
  console.log('[08] line result:', line.result, 'maxLevel:', line.maxLevel)

  await snapshot('before-delete')

  // Delete the sketch (with geometry inside)
  const r = await api.v1.sketch.deleteSketch({ ids: [skId] })
  console.log('[08] delete result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-with-geo-response')

  await snapshot('after-delete')

  return { partId }
}
