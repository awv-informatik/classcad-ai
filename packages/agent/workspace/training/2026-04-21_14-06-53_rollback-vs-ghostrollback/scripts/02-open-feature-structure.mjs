// Observe the structure tree DURING openFeature — does GhostRollbackBar appear?
// Also check what happens to downstream features' visibility.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'GhostTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result
  console.log('[02] Created: box=', boxId, 'cyl=', cylId, 'sph=', sphId)

  // Snapshot BEFORE opening
  await snapshot('before-open')

  // Dump structure before opening
  const beforeR = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  const beforeOpSeq = getOpSeqChildren(beforeR.structure)
  console.log('[02] OpSeq BEFORE openFeature:')
  beforeOpSeq.forEach(c => console.log(`  ${c.id}: ${c.class} "${c.name}"`))
  filewrite(beforeOpSeq, 'opseq-before')

  // Open the MIDDLE feature (Cyl1)
  const openR = await api.v1.part.openFeature({ id: cylId })
  console.log('[02] openFeature result:', openR.result, 'maxLevel:', openR.maxLevel)

  // Snapshot DURING open — what's visible?
  await snapshot('during-open')

  // Dump structure DURING open
  const duringR = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  const duringOpSeq = getOpSeqChildren(duringR.structure)
  console.log('[02] OpSeq DURING openFeature:')
  duringOpSeq.forEach(c => console.log(`  ${c.id}: ${c.class} "${c.name}"`))
  filewrite(duringOpSeq, 'opseq-during')

  // Specifically look for GhostRollbackBar
  const tree = duringR.structure.tree
  const allNodes = Object.values(tree)
  const ghostNodes = allNodes.filter(n => n.class && n.class.toLowerCase().includes('ghost'))
  console.log('[02] Ghost-related nodes:', ghostNodes.length)
  ghostNodes.forEach(n => console.log(`  ${n.id}: ${n.class} "${n.name}" parent=${n.parent}`))

  // Also check: can we still find all features by name during open?
  const findBox = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  const findCyl = await api.v1.part.getFeature({ id: partId, name: 'Cyl1' })
  const findSph = await api.v1.part.getFeature({ id: partId, name: 'Sph1' })
  console.log('[02] findBox:', findBox.result, 'findCyl:', findCyl.result, 'findSph:', findSph.result)

  // Close
  await api.v1.part.closeFeature({ id: cylId })

  // Snapshot AFTER close
  await snapshot('after-close')

  // Dump structure AFTER close
  const afterR = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  const afterOpSeq = getOpSeqChildren(afterR.structure)
  console.log('[02] OpSeq AFTER closeFeature:')
  afterOpSeq.forEach(c => console.log(`  ${c.id}: ${c.class} "${c.name}"`))
  filewrite(afterOpSeq, 'opseq-after')

  return { partId, boxId, cylId, sphId }
}

function getOpSeqChildren(structure) {
  const tree = structure.tree
  // Find OperationSequence
  const opSeq = Object.values(tree).find(n => n.class === 'CC_OperationSequence')
  if (!opSeq) return []
  // Get children
  return Object.values(tree)
    .filter(n => n.parent === opSeq.id)
    .map(n => ({ id: n.id, class: n.class, name: n.name, flags: n.flags }))
}
