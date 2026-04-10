// Test getSketchRegion on a sketch with no regions at all
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Don't create any regions — just look up
  const r = await api.v1.sketch.getSketchRegion({ id: skId, name: 'SketchRegion' })
  console.log('[06] no regions - result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'no-regions')

  return { partId }
}
