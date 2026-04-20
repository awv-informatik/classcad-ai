export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTwoDist' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  // Recalc only (no visualization)
  await api.v1.common.recalc({})

  const edgeIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[08] post-recalc edge IDs:', JSON.stringify(edgeIds))

  // TWO_DISTANCES with recalc-only edges
  const r = await api.v1.part.chamfer({
    id: partId,
    references: edgeIds,
    type: 'TWO_DISTANCES',
    distance1: 5,
    distance2: 15,
  })
  console.log('[08] TWO_DISTANCES result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[08] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel, edgeIds }, 'result')

  await snapshot('after')

  return { partId, chamferId: r.result }
}
