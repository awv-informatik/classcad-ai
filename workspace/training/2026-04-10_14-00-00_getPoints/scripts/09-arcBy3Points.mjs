// getPoints on an arc created via arcBy3Points — does it also return centerId?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [30, 40, 0],
    endPos: [60, 0, 0]
  })).result
  console.log('[09] arcBy3Points arcId:', arcId)

  const r = await api.v1.sketch.getPoints({ id: arcId })
  console.log('[09] getPoints result:', JSON.stringify(r.result))
  console.log('[09] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel }, 'arcBy3Points-getPoints')

  // Verify center position
  if (r.result && r.result.centerId) {
    const centerPos = (await api.v1.sketch.getPositions({ id: r.result.centerId })).result
    console.log('[09] center position:', JSON.stringify(centerPos))
    filewrite(centerPos, 'arcBy3Points-centerPos')
  }

  await snapshot('arc3pt')
  return { partId }
}
