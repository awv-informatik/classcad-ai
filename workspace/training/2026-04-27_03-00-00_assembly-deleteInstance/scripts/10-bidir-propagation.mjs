export default async function (api, { filewrite }) {
  // Setup: assembly with sub-assembly template containing instances
  const rootId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create a sub-assembly template with children
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const partTplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: partTplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: subTplId })

  // Add children to sub-assembly template
  const childInTemplate = (await api.v1.assembly.instance({
    productId: partTplId, ownerId: subTplId, name: 'ChildA',
  })).result
  const childInTemplate2 = (await api.v1.assembly.instance({
    productId: partTplId, ownerId: subTplId, name: 'ChildB',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[10] children in template:', childInTemplate, childInTemplate2)

  // Place two instances of the sub-assembly in root
  await api.v1.assembly.setCurrentProduct({ id: rootId })
  const subInst1 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: rootId, name: 'Sub1',
  })).result
  const subInst2 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: rootId, name: 'Sub2',
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  console.log('[10] sub instances:', subInst1, subInst2)

  // Get expanded-tree children of subInst1
  const expandedChildren1Before = (await api.v1.assembly.getInstance({ ownerId: subInst1 })).result
  const expandedChildren2Before = (await api.v1.assembly.getInstance({ ownerId: subInst2 })).result
  const templateChildrenBefore = (await api.v1.assembly.getInstance({ ownerId: subTplId })).result

  console.log('[10] expanded children of subInst1:', expandedChildren1Before)
  console.log('[10] expanded children of subInst2:', expandedChildren2Before)
  console.log('[10] template children:', templateChildrenBefore)

  filewrite({
    expandedChildren1Before,
    expandedChildren2Before,
    templateChildrenBefore,
  }, 'before-bidir')

  // Delete an expanded-tree child from subInst1
  // This should propagate to template AND subInst2
  const targetChild = expandedChildren1Before[0]
  console.log('[10] deleting expanded-tree child:', targetChild)

  const r = await api.v1.assembly.deleteInstance({ ids: [targetChild] })
  console.log('[10] delete result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'bidir-delete-response')

  // Check all three scopes
  const expandedChildren1After = (await api.v1.assembly.getInstance({ ownerId: subInst1 })).result
  const expandedChildren2After = (await api.v1.assembly.getInstance({ ownerId: subInst2 })).result
  const templateChildrenAfter = (await api.v1.assembly.getInstance({ ownerId: subTplId })).result

  console.log('[10] expanded children of subInst1 after:', expandedChildren1After)
  console.log('[10] expanded children of subInst2 after:', expandedChildren2After)
  console.log('[10] template children after:', templateChildrenAfter)

  filewrite({
    expandedChildren1After,
    expandedChildren2After,
    templateChildrenAfter,
    propagated: {
      inst1Lost: expandedChildren1Before.length - expandedChildren1After.length,
      inst2Lost: expandedChildren2Before.length - expandedChildren2After.length,
      tplLost: templateChildrenBefore.length - templateChildrenAfter.length,
    },
  }, 'after-bidir')

  return { rootId }
}
