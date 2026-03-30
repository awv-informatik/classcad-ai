// Test: update references on a referenced-type axis (change which edge a CURVE follows)
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Get two different edges
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 0] },    // bottom-front edge
      { pos: [0, 0, 20] },    // left-front vertical edge
    ]
  })
  const edge1 = gids.result?.lines?.[0]
  const edge2 = gids.result?.lines?.[1]
  console.log('[06] edge1:', edge1, 'edge2:', edge2)

  if (!edge1 || !edge2) {
    console.log('[06] SKIP — missing edges')
    return { partId }
  }

  // Create CURVE axis following edge1
  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'WA_curve', type: 'CURVE', references: [edge1]
  })).result
  console.log('[06] created CURVE axis:', waId)

  // Update to follow edge2 instead
  await api.v1.part.openFeature({ id: waId })
  const r1 = await api.v1.part.updateWorkAxis({ id: waId, references: [edge2] })
  console.log('[06] update refs result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[06] messages:', JSON.stringify(r1.messages))
  await api.v1.part.closeFeature({ id: waId })

  // Update references only (without specifying type again)
  await api.v1.part.openFeature({ id: waId })
  const r2 = await api.v1.part.updateWorkAxis({ id: waId, references: [edge1] })
  console.log('[06] update refs back result:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: waId })

  filewrite({
    toEdge2: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    backToEdge1: { result: r2.result, maxLevel: r2.maxLevel }
  }, 'update-refs')

  return { partId }
}
