// getPoints on rectangle lines — rectangle returns array of line IDs
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const rectIds = (await api.v1.sketch.rectangle({
    id: skId,
    startPos: [0, 0, 0],
    endPos: [80, 50, 0]
  })).result
  console.log('[05] rectIds:', JSON.stringify(rectIds))

  // Get points for each line in the rectangle
  const results = []
  for (let i = 0; i < rectIds.length; i++) {
    const r = await api.v1.sketch.getPoints({ id: rectIds[i] })
    console.log(`[05] line ${i} (id=${rectIds[i]}):`, JSON.stringify(r.result))
    results.push({ lineIndex: i, lineId: rectIds[i], result: r.result })
  }

  filewrite(results, 'rectangle-getPoints')

  await snapshot('rectangle')
  return { partId }
}
