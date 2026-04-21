export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InsertWorkflow' })).result
  console.log('[10] partId:', partId)

  // Create a design tree: box → cylinder → boolean subtraction
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40, name: 'Base' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 15, height: 60, position: [30, 20, 0], name: 'CutTool' })).result
  const boolId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: boxId, tools: [cylId] })).result
  console.log('[10] boxId:', boxId, 'cylId:', cylId, 'boolId:', boolId)

  await snapshot('original-design')

  // Now we want to INSERT a fillet on the box BEFORE the boolean
  // Step 1: moveBefore the boolean
  await api.v1.part.operationMoveBefore({ id: partId, featureId: boolId })

  // Need to recalc to get valid edge IDs for fillet
  await api.v1.common.recalc()

  // Get an edge ID from the box
  const geoIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 20] }]
  })).result
  console.log('[10] geoIds at mid-tree:', JSON.stringify(geoIds))

  if (geoIds && geoIds.lines && geoIds.lines.length > 0) {
    const edgeId = geoIds.lines[0]
    console.log('[10] edgeId:', edgeId)

    // Create fillet at mid-tree position
    const filletR = await api.v1.part.fillet({ id: partId, radius: 5, geomIds: [edgeId] })
    console.log('[10] fillet result:', filletR.result, 'maxLevel:', filletR.maxLevel)
    filewrite({ result: filletR.result, messages: filletR.messages, maxLevel: filletR.maxLevel }, 'fillet-result')

    if (filletR.result) {
      await snapshot('fillet-before-boolean')
    }
  }

  // Move to end — does the boolean rebuild with the fillet applied?
  await api.v1.part.operationMoveToEnd({ id: partId })
  await snapshot('fillet-plus-boolean')

  // Check the operation sequence
  const r = await api.v1.common.recalc()
  const ops = r.structure.tree['18']
  for (const childId of ops.children) {
    const node = r.structure.tree[String(childId)]
    if (node && node.class && node.class.startsWith('CC_')) {
      console.log('[10]  ', childId, node.class, node.name)
    }
  }

  return { partId }
}
