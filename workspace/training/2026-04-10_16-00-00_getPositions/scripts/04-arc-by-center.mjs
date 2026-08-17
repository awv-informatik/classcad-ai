// getPositions on an arc created via arcByCenter — expects { startPos, endPos, centerPos }
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const arcId = (await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [0, 40, 0],
    endPos: [40, 40, 0],
    centerPos: [20, 40, 0],
  })).result
  console.log('[04] arcByCenter id:', arcId)

  const r = await api.v1.sketch.getPositions({ id: arcId })
  console.log('[04] getPositions result:', JSON.stringify(r.result))
  console.log('[04] maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'arcByCenter-response')

  await snapshot('arcByCenter')
  return { partId }
}
