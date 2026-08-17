export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const geoIds = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }],
  })
  const edgeId = geoIds.result.lines[0]

  // Pass same ID twice
  const r = await api.v1.part.getGeometryPositions({ elems: [edgeId, edgeId] })
  console.log('[16] maxLevel:', r.maxLevel)
  console.log('[16] result count:', r.result.length)
  for (const item of r.result) {
    console.log('[16] id:', item.id, 'positions:', JSON.stringify(item.positions))
  }

  filewrite({ edgeId, result: r.result, maxLevel: r.maxLevel }, 'duplicate-ids')
  return { partId }
}
