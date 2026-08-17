// 10 — ID increment pattern: how many IDs does each line consume?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IdTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[10] skId:', skId)

  // Create 5 lines sequentially, track all IDs
  const lines = []
  for (let i = 0; i < 5; i++) {
    const r = await api.v1.sketch.line({
      id: skId,
      startPos: [i * 20, 0, 0],
      endPos: [i * 20 + 15, 10, 0],
      genFixation: false,
      genIncidence: false,
      genVertAndHoriz: false,
      genTangency: false,
    })
    const lineId = r.result
    const pts = await api.v1.sketch.getPoints({ id: lineId })
    lines.push({ lineId, startId: pts.result.startId, endId: pts.result.endId })
    console.log(`[10] line${i}: id=${lineId} start=${pts.result.startId} end=${pts.result.endId}`)
  }

  // Compute ID gaps
  for (let i = 1; i < lines.length; i++) {
    const gap = lines[i].lineId - lines[i-1].lineId
    console.log(`[10] gap between line${i-1}→line${i}: ${gap}`)
  }

  filewrite(lines, 'id-pattern')
  return { partId, skId }
}
