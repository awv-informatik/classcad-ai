// Baseline: create a multi-feature part and dump the OperationSequence
// to understand where RollbackBar sits in a fresh design tree.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RBTest' })).result
  console.log('[01] partId:', partId)

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  console.log('[01] boxId:', boxId)

  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  console.log('[01] cylId:', cylId)

  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result
  console.log('[01] sphId:', sphId)

  // Dump the full structure to see OperationSequence and RollbackBar
  const r = await api.v1.common.getAppVersion({})
  // We need a call that returns structure — let's use a dummy call
  const dummy = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  filewrite(dummy.structure, 'baseline-structure')

  // Extract just the OperationSequence children
  const opSeq = findNode(dummy.structure, 'CC_OperationSequence')
  if (opSeq) {
    const children = opSeq.children.map(c => ({
      id: c.id,
      class: c.class,
      name: c.name,
      flags: c.flags,
    }))
    console.log('[01] OperationSequence children:')
    children.forEach(c => console.log(`  ${c.id}: ${c.class} "${c.name}" flags=${c.flags}`))
    filewrite(children, 'opseq-children')
  }

  // Check if there's a GhostRollbackBar node anywhere
  const ghost = findNode(dummy.structure, 'CC_GhostRollbackBar')
  console.log('[01] GhostRollbackBar node found:', ghost ? `id=${ghost.id}` : 'NO')

  return { partId, boxId, cylId, sphId }
}

function findNode(structure, className) {
  if (!structure || !structure.data) return null
  for (const node of structure.data) {
    if (node.class === className) return node
  }
  return null
}
