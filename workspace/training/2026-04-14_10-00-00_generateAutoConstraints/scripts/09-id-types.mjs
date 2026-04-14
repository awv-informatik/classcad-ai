// Test: inspect the ID types returned by different geometry creation APIs
// to understand why circle/arc IDs fail with generateAutoConstraints
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'IdTypes' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Create various geometry types
  const lineR = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const circleR = await api.v1.sketch.circle({ id: skId, center: [0, 30, 0], radius: 20 })
  const arcR = await api.v1.sketch.arcByCenter({
    id: skId, center: [60, 30, 0], startPos: [80, 30, 0], endPos: [60, 50, 0]
  })
  const pointR = await api.v1.sketch.point({ id: skId, pos: [-30, 0, 0] })

  console.log('[09] line result:', lineR.result, 'type:', typeof lineR.result)
  console.log('[09] circle result:', circleR.result, 'type:', typeof circleR.result)
  console.log('[09] arc result:', arcR.result, 'type:', typeof arcR.result)
  console.log('[09] point result:', pointR.result, 'type:', typeof pointR.result)

  // Find these in the structure tree to see their classes
  const tree = arcR.structure.tree
  const lineNode = tree[lineR.result]
  const circleNode = tree[circleR.result]
  const arcNode = tree[arcR.result]
  const pointNode = tree[pointR.result]

  console.log('[09] line node class:', lineNode?.class, 'name:', lineNode?.name)
  console.log('[09] circle node class:', circleNode?.class, 'name:', circleNode?.name)
  console.log('[09] arc node class:', arcNode?.class, 'name:', arcNode?.name)
  console.log('[09] point node class:', pointNode?.class, 'name:', pointNode?.name)

  // Try getPoints on each
  const linePoints = await api.v1.sketch.getPoints({ id: lineR.result })
  console.log('[09] line getPoints:', JSON.stringify(linePoints.result))

  const circlePoints = await api.v1.sketch.getPoints({ id: circleR.result })
  console.log('[09] circle getPoints:', JSON.stringify(circlePoints.result))

  const arcPoints = await api.v1.sketch.getPoints({ id: arcR.result })
  console.log('[09] arc getPoints:', JSON.stringify(arcPoints.result))

  // Try autoGen on arc's start point
  if (arcPoints.result?.startId) {
    const rArcPt = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: arcPoints.result.startId })
    console.log('[09] autoGen on arc startPoint:', rArcPt.maxLevel, JSON.stringify(rArcPt.messages))
  }

  // Try autoGen on circle's center point (from getPoints)
  if (circlePoints.result?.centerId) {
    const rCircPt = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: circlePoints.result.centerId })
    console.log('[09] autoGen on circle center:', rCircPt.maxLevel, JSON.stringify(rCircPt.messages))
  }

  return { partId }
}
