export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateRefsTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // Get two different edges
  const edges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [
      { pos: [40, 0, 40] },  // top-front edge
      { pos: [0, 30, 40] },  // top-left edge
    ],
  })).result
  const topFrontEdge = edges.lines[0]
  const topLeftEdge = edges.lines[1]
  console.log('[06] topFrontEdge:', topFrontEdge, 'topLeftEdge:', topLeftEdge)

  // Create fillet on top-front edge
  const filletId = (await api.v1.part.fillet({
    id: partId,
    name: 'MovableFillet',
    references: [topFrontEdge],
    radius: 10,
  })).result
  console.log('[06] filletId:', filletId)

  await snapshot('fillet-on-front')

  // After fillet creation, edge IDs may have changed — re-query
  await api.v1.common.recalc({})
  const newEdges = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [0, 30, 40] }],  // top-left edge (should still exist)
  })).result
  const newTopLeftEdge = newEdges.lines[0]
  console.log('[06] newTopLeftEdge:', newTopLeftEdge)

  // Update references to top-left edge instead
  await api.v1.part.openFeature({ id: filletId })
  const r = await api.v1.part.updateFillet({ id: filletId, references: [newTopLeftEdge] })
  console.log('[06] update refs result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-refs-response')
  await api.v1.part.closeFeature({ id: filletId })

  await snapshot('fillet-on-left')
  return { filletId }
}
