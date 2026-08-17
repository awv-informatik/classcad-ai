// Test: workAxis with revolve — pass sketch lines as references, use built-in YAxis too
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create custom work axis for revolve (along Z at origin)
  const waId = (await api.v1.part.workAxis({
    id: partId,
    name: 'RevAxis',
    position: [0, 0, 0],
    direction: [0, 0, 1]
  })).result
  console.log('[15] workAxis:', waId)

  // Get built-in YAxis for comparison
  const yAxis = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result
  console.log('[15] built-in YAxis:', yAxis)

  // Create sketch on Top plane
  const skId = (await api.v1.sketch.create({ id: partId })).result
  const lines = (await api.v1.sketch.rectangle({
    id: skId,
    startPos: [30, -10, 0],
    endPos: [50, 10, 0]
  })).result
  console.log('[15] sketch lines:', lines)

  // Revolve using sketch lines as references and custom workAxis
  if (lines && waId) {
    const revR = await api.v1.part.revolve({
      id: partId,
      name: 'Rev_custom',
      references: lines,
      axisIds: [waId]
    })
    console.log('[15] revolve(custom) result:', revR.result, 'maxLevel:', revR.maxLevel)
    if (revR.messages?.length) console.log('[15] msgs:', JSON.stringify(revR.messages))
    filewrite({ result: revR.result, messages: revR.messages, maxLevel: revR.maxLevel }, 'revolve-custom')

    if (revR.maxLevel <= 31) {
      await snapshot('revolve-custom-axis')
    }
  }

  return { partId }
}
