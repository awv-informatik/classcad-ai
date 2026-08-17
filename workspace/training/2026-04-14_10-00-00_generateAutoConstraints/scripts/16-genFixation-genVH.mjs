// Test: genFixation and genVertAndHoriz flags
// genFixation: controls fixation at origin
// genVertAndHoriz: controls horizontal/vertical detection
// Strategy: create point at origin FIRST, then line through it.
// The line's auto-gen won't apply to the pre-existing point.
// AutoGen on the point should detect: fixation (at origin) + H/V if applicable.
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'FixVHTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  // Test genFixation: create a point at origin, then a line elsewhere
  const sk1 = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  const pt1 = (await api.v1.sketch.point({ id: sk1, pos: [0, 0, 0] })).result

  const cons1Before = Object.values((await api.v1.sketch.getGeometry({ id: sk1 })).structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[16] point at origin, constraints from creation:', cons1Before.length)
  filewrite(cons1Before.map(c => ({ id: c.id, class: c.class, name: c.name })), 'fix-before')

  // AutoGen with genFixation=false
  const r1a = await api.v1.sketch.generateAutoConstraints({ id: sk1, geomId: pt1, genFixation: false })
  const cons1a = Object.values(r1a.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[16] genFixation=false:', cons1a.length)

  // AutoGen with genFixation=true
  const r1b = await api.v1.sketch.generateAutoConstraints({ id: sk1, geomId: pt1, genFixation: true })
  const cons1b = Object.values(r1b.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[16] genFixation=true:', cons1b.length)
  filewrite(cons1b.map(c => ({ id: c.id, class: c.class, name: c.name })), 'fix-after')

  // Test genVertAndHoriz: create a horizontal line first, then another not-quite-horizontal
  const sk2 = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result
  // Diagonal line — NOT H or V — creation won't add Auto_H or Auto_V
  const l2 = (await api.v1.sketch.line({ id: sk2, startPos: [10, 10, 0], endPos: [50, 30, 0] })).result

  const cons2Before = Object.values((await api.v1.sketch.getGeometry({ id: sk2 })).structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[16] diagonal line, constraints:', cons2Before.length)
  filewrite(cons2Before.map(c => ({ id: c.id, class: c.class, name: c.name })), 'vh-before')

  // genVertAndHoriz should NOT add anything for a diagonal
  const r2a = await api.v1.sketch.generateAutoConstraints({ id: sk2, geomId: l2, genVertAndHoriz: true })
  console.log('[16] diagonal genVertAndHoriz=true:', Object.values(r2a.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint')).length)

  // Now test with an exactly horizontal line that has NO existing Auto_H
  // Create a near-horizontal line (small Y offset) — creation should NOT add Auto_H
  const l3 = (await api.v1.sketch.line({ id: sk2, startPos: [-40, -10, 0], endPos: [0, -10, 0] })).result
  const cons2Mid = Object.values((await api.v1.sketch.getGeometry({ id: sk2 })).structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[16] after exactly-H line, constraints:', cons2Mid.length)
  filewrite(cons2Mid.map(c => ({ id: c.id, class: c.class, name: c.name })), 'vh-mid')

  // AutoGen on the horizontal line — should NOT add anything (already has Auto_H from creation)
  const r2b = await api.v1.sketch.generateAutoConstraints({ id: sk2, geomId: l3, genVertAndHoriz: true })
  console.log('[16] exactly-H autoGen:', Object.values(r2b.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint')).length)

  return { partId }
}
