// Debug: why do circle and arc creation return null?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'CircleDbg' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Circle
  const circleR = await api.v1.sketch.circle({ id: skId, center: [0, 30, 0], radius: 20 })
  console.log('[10] circle result:', circleR.result, 'maxLevel:', circleR.maxLevel)
  console.log('[10] circle messages:', JSON.stringify(circleR.messages))

  // Arc
  const arcR = await api.v1.sketch.arcByCenter({
    id: skId, center: [60, 30, 0], startPos: [80, 30, 0], endPos: [60, 50, 0]
  })
  console.log('[10] arc result:', arcR.result, 'maxLevel:', arcR.maxLevel)
  console.log('[10] arc messages:', JSON.stringify(arcR.messages))

  // Check what's in the structure tree
  const curves = Object.values(arcR.structure.tree)
    .filter(n => n.class && (n.class.includes('Circle') || n.class.includes('Arc') || n.class.includes('Ellipse')))
  console.log('[10] circle/arc nodes:', curves.length)
  filewrite(curves.map(c => ({ id: c.id, class: c.class, name: c.name })), 'circle-arc-nodes')

  // Check all sketch children
  const sketchNode = arcR.structure.tree[skId]
  console.log('[10] sketch children:', sketchNode?.children?.length)

  // List all geometry in the sketch
  const allGeom = Object.values(arcR.structure.tree)
    .filter(n => n.class && (n.class.startsWith('CC_') && !n.class.includes('Constraint') && !n.class.includes('Work')))
  filewrite(allGeom.map(c => ({ id: c.id, class: c.class, name: c.name })), 'all-geom')

  await snapshot('circle-arc')
  return { partId }
}
