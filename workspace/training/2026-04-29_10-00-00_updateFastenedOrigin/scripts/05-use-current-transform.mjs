export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'UCTTest' })).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instance with explicit transformation
  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
    transformation: [[80, 40, 25], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create foId at origin first
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst], csys: wcs },
    xOffset: 0, yOffset: 0, zOffset: 0,
  })).result
  console.log('[05] foId:', foId)

  const before = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[05] before — offsets:', before.xOffset, before.yOffset, before.zOffset)
  filewrite(before, 'before-uct')
  await snapshot('at-origin')

  // Now update with useCurrentTransform — should recompute offsets
  // But wait, the constraint already moved the instance to origin... let's try a different approach:
  // First update offsets manually to move instance somewhere
  await api.v1.assembly.updateFastenedOrigin({ id: foId, xOffset: 80, yOffset: 40, zOffset: 25 })
  await snapshot('at-position')

  const midState = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[05] after manual move — offsets:', midState.xOffset, midState.yOffset, midState.zOffset)

  // Now update with useCurrentTransform — should preserve current position
  const r = await api.v1.assembly.updateFastenedOrigin({ id: foId, useCurrentTransform: 1 })
  console.log('[05] useCurrentTransform result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'uct-response')

  const after = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[05] after UCT — offsets:', after.xOffset, after.yOffset, after.zOffset)
  console.log('[05] rotations:', after.xRotation, after.yRotation, after.zRotation)
  filewrite(after, 'after-uct')
  await snapshot('after-uct')

  // Test: useCurrentTransform with explicit offsets — which wins?
  await api.v1.assembly.updateFastenedOrigin({
    id: foId, useCurrentTransform: 1, xOffset: 999, yOffset: 999,
  })
  const conflictState = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  console.log('[05] UCT + explicit offsets — xOffset:', conflictState.xOffset, '(999 means explicit won, ~80 means UCT won)')
  filewrite(conflictState, 'uct-vs-explicit')

  return { foId }
}
