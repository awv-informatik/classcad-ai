// 01 — basic rectangle: corner-to-corner, examine return value and line mapping
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RectTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const r = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [80, 50, 0],
  })

  console.log('[01] result (4 line IDs):', r.result)
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))
  console.log('[01] result length:', r.result?.length)

  // Persist full response
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'response')

  // Get positions of each line to understand index mapping
  // Doc says:
  //   index 0: horizontal line not connected to end position
  //   index 1: vertical line connected to end position
  //   index 2: horizontal line connected to end position
  //   index 3: vertical line not connected to end position
  for (let i = 0; i < r.result.length; i++) {
    const pts = await api.v1.sketch.getPositions({ id: skId, geometryId: r.result[i] })
    console.log(`[01] line[${i}] positions:`, JSON.stringify(pts.result))
  }

  await snapshot('basic-rect')
  return { partId }
}
