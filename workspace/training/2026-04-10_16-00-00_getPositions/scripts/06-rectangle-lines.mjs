// getPositions on each line of a rectangle
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectResult = (await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [80, 50, 0],
  })).result
  console.log('[06] rectangle result:', JSON.stringify(rectResult))

  // rectResult should be array of line IDs
  const lineIds = Array.isArray(rectResult) ? rectResult : [rectResult]
  console.log('[06] line IDs:', lineIds)

  const positions = []
  for (const lid of lineIds) {
    const r = await api.v1.sketch.getPositions({ id: lid })
    console.log(`[06] line ${lid}:`, JSON.stringify(r.result))
    positions.push({ lineId: lid, ...r.result })
  }

  filewrite(positions, 'rectangle-positions')

  await snapshot('rectangle')
  return { partId }
}
