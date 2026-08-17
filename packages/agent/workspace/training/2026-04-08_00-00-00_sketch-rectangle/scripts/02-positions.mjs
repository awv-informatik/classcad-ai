// 02 — get positions of each rectangle line to verify index mapping
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PosTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Rectangle from (10,10,0) to (80,50,0)
  const r = await api.v1.sketch.rectangle({
    id: skId,
    startPos: [10, 10, 0],
    endPos: [80, 50, 0],
  })
  console.log('[02] line IDs:', r.result)

  // getPositions takes { id: lineId } — the line ID directly
  for (let i = 0; i < r.result.length; i++) {
    const pos = await api.v1.sketch.getPositions({ id: r.result[i] })
    console.log(`[02] line[${i}] (id=${r.result[i]}):`, JSON.stringify(pos.result))
  }

  // Also get points (vertex IDs) for each line
  for (let i = 0; i < r.result.length; i++) {
    const pts = await api.v1.sketch.getPoints({ id: r.result[i] })
    console.log(`[02] line[${i}] point IDs:`, JSON.stringify(pts.result))
  }

  filewrite(r.result, 'line-ids')
  await snapshot('positions')
  return { partId }
}
