// Create a sketch region from a circle (single closed geometry)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CircleRegion' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circ = await api.v1.sketch.circle({
    id: skId,
    centerPos: [40, 30, 0],
    radius: 25,
  })
  console.log('[03] circle result:', circ.result, 'maxLevel:', circ.maxLevel)

  // Circle is inherently closed — try region with just [circleId]
  const region = await api.v1.sketch.sketchRegion({
    id: skId,
    geomIds: [circ.result],
  })
  console.log('[03] region from circle result:', region.result, 'maxLevel:', region.maxLevel)
  console.log('[03] messages:', JSON.stringify(region.messages))

  filewrite({ result: region.result, messages: region.messages, maxLevel: region.maxLevel }, 'circle-region')

  await snapshot('circle-region')
  return { partId, regionId: region.result }
}
