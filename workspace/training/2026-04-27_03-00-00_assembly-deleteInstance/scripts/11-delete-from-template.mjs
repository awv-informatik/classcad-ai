export default async function (api, { filewrite }) {
  // Setup: sub-assembly template with children, instantiated twice
  const rootId = (await api.v1.assembly.create({ name: 'Root' })).result
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const partTplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: partTplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: subTplId })

  const childA = (await api.v1.assembly.instance({
    productId: partTplId, ownerId: subTplId, name: 'ChildA',
  })).result
  const childB = (await api.v1.assembly.instance({
    productId: partTplId, ownerId: subTplId, name: 'ChildB',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: rootId })
  const subInst1 = (await api.v1.assembly.instance({ productId: subTplId, ownerId: rootId, name: 'Sub1' })).result
  const subInst2 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: rootId, name: 'Sub2',
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Record before state
  const tplChildrenBefore = (await api.v1.assembly.getInstance({ ownerId: subTplId })).result
  const inst1ChildrenBefore = (await api.v1.assembly.getInstance({ ownerId: subInst1 })).result
  const inst2ChildrenBefore = (await api.v1.assembly.getInstance({ ownerId: subInst2 })).result

  console.log('[11] template children before:', tplChildrenBefore)
  console.log('[11] inst1 children before:', inst1ChildrenBefore)
  console.log('[11] inst2 children before:', inst2ChildrenBefore)

  // Delete from template directly (not from expanded tree)
  console.log('[11] deleting template child:', childA)
  const r = await api.v1.assembly.deleteInstance({ ids: [childA] })
  console.log('[11] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'template-delete-response')

  // Check all scopes
  const tplChildrenAfter = (await api.v1.assembly.getInstance({ ownerId: subTplId })).result
  const inst1ChildrenAfter = (await api.v1.assembly.getInstance({ ownerId: subInst1 })).result
  const inst2ChildrenAfter = (await api.v1.assembly.getInstance({ ownerId: subInst2 })).result

  console.log('[11] template children after:', tplChildrenAfter)
  console.log('[11] inst1 children after:', inst1ChildrenAfter)
  console.log('[11] inst2 children after:', inst2ChildrenAfter)

  filewrite({
    tplBefore: tplChildrenBefore, tplAfter: tplChildrenAfter,
    inst1Before: inst1ChildrenBefore, inst1After: inst1ChildrenAfter,
    inst2Before: inst2ChildrenBefore, inst2After: inst2ChildrenAfter,
    propagated: {
      tplLost: tplChildrenBefore.length - tplChildrenAfter.length,
      inst1Lost: inst1ChildrenBefore.length - inst1ChildrenAfter.length,
      inst2Lost: inst2ChildrenBefore.length - inst2ChildrenAfter.length,
    },
  }, 'template-delete-comparison')

  return { rootId }
}
