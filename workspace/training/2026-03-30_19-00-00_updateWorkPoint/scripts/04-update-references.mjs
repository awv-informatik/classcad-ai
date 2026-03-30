// Test updateWorkPoint — change references (e.g., snap BREPVERTEX to a different vertex)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UWPTest' })).result

  // Create a box
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get two different vertices
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [
      { pos: [0, 0, 0] },
      { pos: [80, 60, 40] }
    ]
  })
  const vertex1 = gids.result.points[0]
  const vertex2 = gids.result.points[1]
  console.log('[04] vertex1:', vertex1, 'vertex2:', vertex2)

  // Create BREPVERTEX work point at vertex1
  const wpId = (await api.v1.part.workPoint({
    id: partId,
    name: 'WP_refChange',
    type: 'BREPVERTEX',
    references: [vertex1]
  })).result
  console.log('[04] created BREPVERTEX wpId:', wpId)

  // Update to point at vertex2
  await api.v1.part.openFeature({ id: wpId })
  const r = await api.v1.part.updateWorkPoint({
    id: wpId,
    references: [vertex2]
  })
  console.log('[04] update refs — result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[04] messages:', JSON.stringify(r.messages))
  await api.v1.part.closeFeature({ id: wpId })

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'ref-change')

  return { partId }
}
