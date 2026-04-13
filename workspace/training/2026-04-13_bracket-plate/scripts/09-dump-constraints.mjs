// Dump structure tree for a sketch with various constraints
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create geometry
  const l1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [60, 0, 0] })
  const l2 = await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [60, 40, 0] })
  const l3 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [0, 40, 0] })
  const c1 = await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 10 })

  const lineIds = [l1.result, l2.result, l3.result]
  console.log('[09] lines:', lineIds, 'circle:', c1.result)

  // Add various constraints
  const cHoriz = await api.v1.sketch.constraint({ id: skId, type: 'HORIZONTAL', geomIds: [lineIds[0]] })
  console.log('[09] HORIZONTAL:', cHoriz.result, 'maxLevel:', cHoriz.maxLevel)

  const cVert = await api.v1.sketch.constraint({ id: skId, type: 'VERTICAL', geomIds: [lineIds[1]] })
  console.log('[09] VERTICAL:', cVert.result, 'maxLevel:', cVert.maxLevel)

  const cPerp = await api.v1.sketch.constraint({ id: skId, type: 'PERPENDICULAR', geomIds: [lineIds[0], lineIds[1]] })
  console.log('[09] PERPENDICULAR:', cPerp.result, 'maxLevel:', cPerp.maxLevel)

  const cParallel = await api.v1.sketch.constraint({ id: skId, type: 'PARALLEL', geomIds: [lineIds[1], lineIds[2]] })
  console.log('[09] PARALLEL:', cParallel.result, 'maxLevel:', cParallel.maxLevel)

  const cEqual = await api.v1.sketch.constraint({ id: skId, type: 'EQUAL_LENGTH', geomIds: [lineIds[1], lineIds[2]] })
  console.log('[09] EQUAL_LENGTH:', cEqual.result, 'maxLevel:', cEqual.maxLevel)

  const cFix = await api.v1.sketch.constraint({ id: skId, type: 'FIXATION', geomIds: [lineIds[0]] })
  console.log('[09] FIXATION:', cFix.result, 'maxLevel:', cFix.maxLevel)

  // Dump ALL constraint-related nodes from the structure tree
  const tree = cFix.structure?.tree || {}

  // Find all constraint nodes
  const constraintNodes = {}
  for (const [id, obj] of Object.entries(tree)) {
    if (obj.class?.includes('Constraint') || obj.class?.includes('constraint')) {
      constraintNodes[id] = obj
    }
  }
  filewrite(constraintNodes, 'constraint-nodes')

  // Also check: are auto-generated constraints visible?
  // The line creation with genFixation, genIncidence etc. may have created constraints too
  // Look for anything with "Constraint" in the class name
  const allClasses = new Set()
  for (const obj of Object.values(tree)) {
    allClasses.add(obj.class)
  }
  console.log('[09] all classes:', [...allClasses].sort().join(', '))

  // Dump the sketch node to see its children
  filewrite(tree[String(skId)], 'sketch-node')

  return { partId }
}
