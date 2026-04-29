export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'EdgeCases' })).result

  // Edge case 1: instance of empty template
  const emptyTpl = (await api.v1.assembly.partTemplate({ name: 'Empty' })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const emptyInst = (await api.v1.assembly.instance({ productId: emptyTpl, ownerId: asmId, name: 'EmptyInst' })).result
  console.log('[14] empty instance:', emptyInst, '— maxLevel success')

  // Edge case 2: instance with 4x4 matrix transformation
  const tpl = (await api.v1.assembly.partTemplate({ name: 'MatrixPart' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 20, width: 20, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const matrixInst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'MatrixInst',
    transformation: [
      [1, 0, 0, 50],
      [0, 1, 0, 30],
      [0, 0, 1, 10],
      [0, 0, 0, 1],
    ],
  })).result
  console.log('[14] matrix instance:', matrixInst)

  // Edge case 3: self-referencing — instance a template inside itself (should fail?)
  // Using assembly template for this
  const selfTpl = (await api.v1.assembly.assemblyTemplate({ name: 'Self' })).result
  await api.v1.assembly.setCurrentProduct({ id: selfTpl })
  const selfInst = await api.v1.assembly.instance({ productId: selfTpl, ownerId: selfTpl, name: 'SelfRef' })
  console.log('[14] self-reference:', selfInst.maxLevel, selfInst.result)
  if (selfInst.messages?.length) {
    console.log('[14] self-ref messages:', selfInst.messages.map(m => m.message))
  }

  // Edge case 4: instance a part template as if it were an assembly template
  // (should work — instance() works with any product ID)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Edge case 5: multiple instances with the same name
  const dupA = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'DupName' })).result
  const dupB = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'DupName',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[14] duplicate names: dupA:', dupA, 'dupB:', dupB)

  // Can getInstance find both?
  const foundDup = await api.v1.assembly.getInstance({ ownerId: asmId, name: 'DupName' })
  console.log('[14] getInstance(DupName):', JSON.stringify(foundDup.result))

  // Edge case 6: no-name instance (auto-naming)
  const autoName = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId,
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[14] auto-named instance:', autoName)

  // Check auto-generated name
  const r = await api.v1.common.getAppVersion({})
  const autoNode = r.structure.tree[autoName]
  console.log('[14] auto-name:', autoNode?.name)

  return { asmId }
}
