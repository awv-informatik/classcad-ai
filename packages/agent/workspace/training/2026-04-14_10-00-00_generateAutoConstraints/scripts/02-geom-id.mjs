// Test generateAutoConstraints with individual geometry IDs (lines drawn manually)
// Rectangle auto-creates constraints. Use manual lines to start clean.
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'AutoConGeomId' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Draw two separate lines — one horizontal-ish, one vertical-ish
  const l1 = (await api.v1.sketch.line({ id: skId, startPos: [0, 0, 0], endPos: [80, 0.5, 0] })).result
  const l2 = (await api.v1.sketch.line({ id: skId, startPos: [80, 0, 0], endPos: [80.3, 60, 0] })).result

  // Count constraints before
  const r0 = await api.v1.sketch.line({ id: skId, startPos: [0,0,0], endPos: [0,0,0] }) // dummy to get structure
  // Actually let's just get the structure from the last call
  const structBefore = (await api.v1.sketch.getGeometry({ id: skId }))
  const consBefore = Object.values(structBefore.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[02] constraints before autoGen:', consBefore.length)
  filewrite(consBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-before')

  // AutoGen on line1
  const r1 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l1 })
  console.log('[02] autoGen l1 result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[02] autoGen l1 messages:', JSON.stringify(r1.messages))

  const consAfterL1 = Object.values(r1.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[02] constraints after autoGen l1:', consAfterL1.length)

  // AutoGen on line2
  const r2 = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: l2 })
  console.log('[02] autoGen l2 result:', r2.result, 'maxLevel:', r2.maxLevel)

  const consAfterL2 = Object.values(r2.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[02] constraints after autoGen l2:', consAfterL2.length)

  // Show all constraints
  const newCons = consAfterL2.filter(c => !consBefore.find(b => b.id === c.id))
  console.log('[02] new constraints total:', newCons.length)
  filewrite(newCons.map(c => ({ id: c.id, class: c.class, name: c.name })), 'new-constraints')
  filewrite(consAfterL2.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-after')

  await snapshot('after-autogen')
  return { partId }
}
