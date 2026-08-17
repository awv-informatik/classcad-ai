// Test generateAutoConstraints with sketch ID as geomId on a simple rectangle
// Question: What constraints does it auto-generate for a rectangle? How to detect them?
export default async function (api, { snapshot, filewrite }) {
  const partR = await api.v1.part.create({ name: 'AutoConTest' })
  const partId = partR.result
  const topPlane = Object.values(partR.structure.tree)
    .find(n => n.class === 'CC_WorkPlane' && n.name === 'Top')

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topPlane.id })).result

  // Draw a rectangle (creates 4 lines)
  const rectR = await api.v1.sketch.rectangle({ id: skId, startPos: [0, 0, 0], endPos: [80, 50, 0] })
  console.log('[01] rectangle result:', rectR.result, 'maxLevel:', rectR.maxLevel)

  // Count constraint nodes BEFORE
  const constraintsBefore = Object.values(rectR.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[01] constraints before autoGen:', constraintsBefore.length)
  filewrite(constraintsBefore.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-before')

  // Call generateAutoConstraints with sketch ID as geomId
  const r = await api.v1.sketch.generateAutoConstraints({ id: skId, geomId: skId })
  console.log('[01] generateAutoConstraints result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages))

  // Count constraint nodes AFTER
  const constraintsAfter = Object.values(r.structure.tree)
    .filter(n => n.class && n.class.includes('Constraint'))
  console.log('[01] constraints after autoGen:', constraintsAfter.length)
  console.log('[01] new constraints:', constraintsAfter.length - constraintsBefore.length)
  filewrite(constraintsAfter.map(c => ({ id: c.id, class: c.class, name: c.name })), 'constraints-after')

  await snapshot('after-autogen')
  return { partId }
}
