// Compare node flags and properties in three states:
// 1. All features active (bar at end)
// 2. operationMoveBefore (bar mid-tree)
// 3. openFeature (ghost mid-tree)
// Looking for observable differences in the structure tree.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FlagsTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result

  // STATE 1: All active
  const s1 = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  const state1 = extractState(s1.structure)
  console.log('[08] STATE 1 — All active:')
  logState(state1)
  filewrite(state1, 'state1-all-active')

  // STATE 2: operationMoveBefore(cylId) — cyl and sph hidden
  await api.v1.part.operationMoveBefore({ id: partId, featureId: cylId })
  const s2 = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  const state2 = extractState(s2.structure)
  console.log('[08] STATE 2 — moveBefore(Cyl1):')
  logState(state2)
  filewrite(state2, 'state2-movebefore')
  await api.v1.part.operationMoveToEnd({ id: partId })

  // STATE 3: openFeature(cylId) — ghost at cyl
  await api.v1.part.openFeature({ id: cylId })
  const s3 = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
  const state3 = extractState(s3.structure)
  console.log('[08] STATE 3 — openFeature(Cyl1):')
  logState(state3)
  filewrite(state3, 'state3-openfeature')
  await api.v1.part.closeFeature({ id: cylId })

  // Compare: are flags different between states?
  console.log('\n[08] === FLAG COMPARISON ===')
  const names = ['BoxRef', 'CylinderRef', 'SphereRef', 'RollbackBar']
  for (const name of names) {
    const f1 = state1.find(n => n.name === name)
    const f2 = state2.find(n => n.name === name)
    const f3 = state3.find(n => n.name === name)
    const changed = (f1?.flags !== f2?.flags) || (f1?.flags !== f3?.flags)
    console.log(`  ${name}: state1=${f1?.flags} state2=${f2?.flags} state3=${f3?.flags} ${changed ? '← CHANGED' : '(same)'}`)
  }

  return { partId }
}

function extractState(structure) {
  const tree = structure.tree
  const opSeqId = Object.values(tree).find(n => n.class === 'CC_OperationSequence')?.id
  return Object.values(tree)
    .filter(n => n.parent === opSeqId)
    .map(n => ({
      id: n.id,
      class: n.class,
      name: n.name,
      flags: n.flags,
      children: n.children,
      properties: n.properties,
    }))
}

function logState(state) {
  state.filter(n => ['BoxRef', 'CylinderRef', 'SphereRef', 'RollbackBar'].includes(n.name) || n.class === 'CC_RollbackBar')
    .forEach(n => console.log(`  ${n.name}: flags=${n.flags} children=${n.children}`))
}
