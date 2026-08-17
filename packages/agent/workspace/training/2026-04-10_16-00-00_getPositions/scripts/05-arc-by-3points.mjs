// getPositions on an arc created via arcBy3Points — same shape as arcByCenter?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcBy3Points({
    id: skId,
    startPos: [0, 0, 0],
    midPos: [20, 20, 0],
    endPos: [40, 0, 0],
  })).result
  console.log('[05] arcBy3Points id:', arcId)

  const r = await api.v1.sketch.getPositions({ id: arcId })
  console.log('[05] getPositions result:', JSON.stringify(r.result))
  console.log('[05] maxLevel:', r.maxLevel)
  console.log('[05] result keys:', Object.keys(r.result))

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'arcBy3Points-response')

  await snapshot('arcBy3Points')
  return { partId }
}
