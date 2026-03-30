// Test updateWorkPoint — change type from USERDEFINED to BREPVERTEX
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UWPTest' })).result

  // Create a box to get brep geometry
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }]
  })
  const vertexId = gids.result.points[0]
  console.log('[03] vertexId:', vertexId)

  // Create USERDEFINED work point
  const wpId = (await api.v1.part.workPoint({
    id: partId,
    name: 'WP_typeChange',
    position: [10, 20, 30]
  })).result
  console.log('[03] created USERDEFINED wpId:', wpId)

  // Change type to BREPVERTEX with openFeature
  await api.v1.part.openFeature({ id: wpId })
  const r1 = await api.v1.part.updateWorkPoint({
    id: wpId,
    type: 'BREPVERTEX',
    references: [vertexId]
  })
  console.log('[03] change to BREPVERTEX — result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[03] messages:', JSON.stringify(r1.messages))
  await api.v1.part.closeFeature({ id: wpId })

  // Now try changing back to USERDEFINED
  await api.v1.part.openFeature({ id: wpId })
  const r2 = await api.v1.part.updateWorkPoint({
    id: wpId,
    type: 'USERDEFINED',
    position: [50, 50, 50]
  })
  console.log('[03] change back to USERDEFINED — result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[03] messages:', JSON.stringify(r2.messages))
  await api.v1.part.closeFeature({ id: wpId })

  filewrite({ toBrepVertex: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, backToUserDefined: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages } }, 'type-change')

  return { partId }
}
