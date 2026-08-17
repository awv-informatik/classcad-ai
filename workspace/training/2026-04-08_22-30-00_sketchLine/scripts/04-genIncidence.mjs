// 04 — genIncidence: do connected endpoints auto-generate coincidence constraints?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IncTest' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Line 1: (0,0,0) → (50,0,0)
  const r1 = await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [50, 0, 0] })
  const line1 = r1.result
  console.log('[04] line1:', line1)

  // Line 2: starts at same point as line1 end → should get auto-coincidence
  const r2 = await api.v1.sketch.line({ id: skId, startPos: [50, 0, 0], endPos: [50, 40, 0] })
  const line2 = r2.result
  console.log('[04] line2:', line2)

  // Line 3: starts at same point but with genIncidence=false → should NOT get coincidence
  const r3 = await api.v1.sketch.line({ id: skId, startPos: [50, 40, 0], endPos: [0, 40, 0], genIncidence: false })
  const line3 = r3.result
  console.log('[04] line3 (noIncidence):', line3)

  // Dump structure after all lines to see constraints
  filewrite(r3.structure, 'structure-incidence')

  // Count constraints in the sketch
  const tree = r3.structure.tree
  let constraints = []
  for (const [id, node] of Object.entries(tree)) {
    if (node.class && node.class.includes('Constraint') && node.parent === skId) {
      constraints.push({ id: node.id, name: node.name, class: node.class })
    }
  }
  console.log('[04] constraints found:', JSON.stringify(constraints))
  filewrite(constraints, 'constraints')

  await snapshot('incidence-test')
  return { partId, skId }
}
