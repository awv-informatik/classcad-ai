// Test: realistic usage — workAxis as revolve axis
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create work axis for revolve (along Y at x=0)
  const waId = (await api.v1.part.workAxis({
    id: partId,
    name: 'RevolveAxis',
    position: [0, 0, 0],
    direction: [0, 1, 0]
  })).result
  console.log('[14] workAxis:', waId)

  // Create sketch on Top plane (XY)
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Draw a rectangle — offset from axis so revolve creates a donut/ring
  const lines = (await api.v1.sketch.rectangle({
    id: skId,
    startPos: [20, -10, 0],
    endPos: [40, 10, 0]
  })).result
  console.log('[14] sketch lines:', lines)

  // Create region from the rectangle lines
  const regionR = await api.v1.sketch.sketchRegion({ id: skId, geomIds: lines })
  console.log('[14] region:', regionR.result, 'maxLevel:', regionR.maxLevel)
  if (regionR.messages?.length) console.log('[14] region msgs:', JSON.stringify(regionR.messages))

  const regionId = regionR.result

  if (regionId && waId) {
    const revR = await api.v1.part.revolve({
      id: partId,
      references: [regionId],
      axisIds: [waId]
    })
    console.log('[14] revolve result:', revR.result, 'maxLevel:', revR.maxLevel)
    if (revR.messages?.length) console.log('[14] revolve msgs:', JSON.stringify(revR.messages))
    filewrite({ result: revR.result, messages: revR.messages, maxLevel: revR.maxLevel }, 'revolve-response')

    await snapshot('revolve-with-workaxis')
  } else {
    console.log('[14] SKIP revolve — no region or axis')
  }

  return { partId }
}
