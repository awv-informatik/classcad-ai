// Test: what happens when you update position on a referenced type (BREPVERTEX)?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UWPTest' })).result

  // Create box and get vertex
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }]
  })
  const vertexId = gids.result.points[0]

  // Create BREPVERTEX work point
  const wpId = (await api.v1.part.workPoint({
    id: partId,
    name: 'WP_posOnRef',
    type: 'BREPVERTEX',
    references: [vertexId]
  })).result
  console.log('[05] created BREPVERTEX wpId:', wpId)

  // Try updating position on a referenced type
  await api.v1.part.openFeature({ id: wpId })
  const r = await api.v1.part.updateWorkPoint({
    id: wpId,
    position: [999, 999, 999]
  })
  console.log('[05] update position on BREPVERTEX — result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[05] messages:', JSON.stringify(r.messages))
  await api.v1.part.closeFeature({ id: wpId })

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'position-on-referenced')

  return { partId }
}
