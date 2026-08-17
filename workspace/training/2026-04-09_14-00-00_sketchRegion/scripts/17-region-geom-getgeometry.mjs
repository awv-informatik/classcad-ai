// Can you call sketch.getGeometry on a region ID? The docs hint at this.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GetGeomTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rect = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [60, 40, 0] })
  const region = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect.result })
  console.log('[17] region id:', region.result)

  // Try getGeometry on the region ID
  const geom = await api.v1.sketch.getGeometry({ id: region.result })
  console.log('[17] getGeometry result:', geom.result, 'maxLevel:', geom.maxLevel)
  console.log('[17] messages:', JSON.stringify(geom.messages))

  filewrite({ getGeomResult: geom.result, maxLevel: geom.maxLevel, messages: geom.messages }, 'get-geometry-on-region')

  return { partId }
}
