// Test: Call updateSketchRegion with empty regions array
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const r = await api.v1.sketch.updateSketchRegion({ regions: [] })
  console.log('[15] empty regions result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[15] messages:', JSON.stringify(r.messages))
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'empty-regions')

  return { partId }
}
