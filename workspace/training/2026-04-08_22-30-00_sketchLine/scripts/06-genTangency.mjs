// 06 — genTangency: does it trigger for lines tangent to arcs?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TanTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create an arc first
  const arc = await api.v1.sketch.arcByCenter({
    id: skId,
    startPos: [50, 0, 0],
    endPos: [0, 50, 0],
    centerPos: [0, 0, 0],
  })
  console.log('[06] arc:', arc.result, 'maxLevel:', arc.maxLevel)

  // Create a line starting at the arc endpoint that is tangent direction
  // Arc ends at (0,50,0), tangent direction at that point is (-1,0,0) roughly
  const r1 = await api.v1.sketch.line({ id: skId, startPos: [0, 50, 0], endPos: [-50, 50, 0] })
  console.log('[06] tangent line:', r1.result, 'maxLevel:', r1.maxLevel)

  // Create a line with genTangency=false from same endpoint
  const r2 = await api.v1.sketch.line({
    id: skId,
    startPos: [0, 50, 0],
    endPos: [0, 100, 0],
    genTangency: false,
  })
  console.log('[06] noTangency line:', r2.result)

  // Dump constraints
  const tree = r2.structure.tree
  let constraints = []
  for (const [id, node] of Object.entries(tree)) {
    if (node.class && node.class.includes('Constraint') && node.parent === skId) {
      constraints.push({ id: node.id, name: node.name, class: node.class })
    }
  }
  console.log('[06] constraints:', JSON.stringify(constraints))
  filewrite(constraints, 'tangency-constraints')

  await snapshot('tangency-test')
  return { partId, skId }
}
