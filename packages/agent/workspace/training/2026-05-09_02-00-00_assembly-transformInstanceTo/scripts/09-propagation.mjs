export default async function (api, { snapshot, filewrite }) {
  // Setup: sub-assembly with a child, instantiated twice in root
  const rootId = (await api.v1.assembly.create({})).result

  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const partTplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: partTplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: subTplId })

  // Child inside sub-assembly
  const childInst = (await api.v1.assembly.instance({
    productId: partTplId, ownerId: subTplId, name: 'Child',
  })).result

  // Two instances of the sub-assembly in root
  await api.v1.assembly.setCurrentProduct({ id: rootId })
  const sub1 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: rootId, name: 'Sub1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const sub2 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: rootId, name: 'Sub2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Get child ET IDs under each sub-assembly instance
  const children1 = (await api.v1.assembly.getInstance({ ownerId: sub1 })).result
  const children2 = (await api.v1.assembly.getInstance({ ownerId: sub2 })).result
  console.log('[09] children under Sub1:', JSON.stringify(children1))
  console.log('[09] children under Sub2:', JSON.stringify(children2))

  const childET1 = Array.isArray(children1) ? children1[0] : children1
  const childET2 = Array.isArray(children2) ? children2[0] : children2

  await snapshot('before')
  const cog0 = (await api.v1.assembly.calculateMassProperties({ id: rootId })).result
  console.log('[09] COG before:', JSON.stringify(cog0?.cog))

  // Transform child in Sub1 to [0, 40, 0]
  // Does this propagate to the same child in Sub2?
  await api.v1.assembly.transformInstanceTo({
    id: childET1,
    transformation: [[0, 40, 0], [1, 0, 0], [0, 1, 0]],
  })

  await snapshot('after-transform-child-in-sub1')
  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: rootId })).result
  console.log('[09] COG after transforming child in Sub1:', JSON.stringify(cog1?.cog))

  filewrite({
    cogBefore: cog0?.cog,
    cogAfter: cog1?.cog,
    childET1, childET2,
    sub1, sub2,
  }, 'propagation-results')

  return { rootId, sub1, sub2, childET1, childET2 }
}
