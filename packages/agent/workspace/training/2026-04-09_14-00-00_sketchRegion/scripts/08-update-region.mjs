// updateSketchRegion — change the geometry of an existing region
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create two rectangles
  const rect1 = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [40, 30, 0] })
  const rect2 = await api.v1.sketch.rectangle({ id: skId, startPos: [50, 0, 0], endPos: [100, 60, 0] })

  // Create region from rect1
  const region = await api.v1.sketch.sketchRegion({ id: skId, geomIds: rect1.result })
  console.log('[08] initial region:', region.result)

  await snapshot('before-update')

  // Update the region to use rect2 instead
  const upd = await api.v1.sketch.updateSketchRegion({
    regions: [{ id: region.result, geomIds: rect2.result }],
  })
  console.log('[08] updateSketchRegion result:', upd.result, 'maxLevel:', upd.maxLevel)
  console.log('[08] messages:', JSON.stringify(upd.messages))

  filewrite({ updateResult: upd.result, maxLevel: upd.maxLevel, messages: upd.messages }, 'update-response')

  await snapshot('after-update')
  return { partId, regionId: region.result }
}
