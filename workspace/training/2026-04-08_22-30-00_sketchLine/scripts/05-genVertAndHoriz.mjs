// 05 — genVertAndHoriz: horizontal and vertical auto-constraints
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'VHTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Horizontal line (y constant) — should generate horizontal constraint
  const r1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  console.log('[05] horizontal line:', r1.result)

  // Vertical line (x constant) — should generate vertical constraint
  const r2 = await api.v1.sketch.line({ id: skId, startPos: [60, 0, 0], endPos: [60, 40, 0] })
  console.log('[05] vertical line:', r2.result)

  // Diagonal line — should NOT get vert/horiz constraint
  const r3 = await api.v1.sketch.line({ id: skId, startPos: [80, 0, 0], endPos: [100, 30, 0] })
  console.log('[05] diagonal line:', r3.result)

  // Horizontal line with genVertAndHoriz=false — should NOT get constraint
  const r4 = await api.v1.sketch.line({ id: skId, startPos: [0, 50, 0], endPos: [50, 50, 0], genVertAndHoriz: false })
  console.log('[05] horizontal (noVH):', r4.result)

  // Dump constraints
  const tree = r4.structure.tree
  let constraints = []
  for (const [id, node] of Object.entries(tree)) {
    if (node.class && node.class.includes('Constraint') && node.parent === skId) {
      constraints.push({ id: node.id, name: node.name, class: node.class })
    }
  }
  console.log('[05] constraints:', JSON.stringify(constraints))
  filewrite(constraints, 'vh-constraints')

  await snapshot('vh-test')
  return { partId, skId }
}
