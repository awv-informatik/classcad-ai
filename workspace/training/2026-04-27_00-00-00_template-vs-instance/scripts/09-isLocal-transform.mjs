export default async function (api, { snapshot, filewrite }) {
  // Test isLocal flag: global vs local transformation when adding to a sub-assembly
  const asmId = (await api.v1.assembly.create({ name: 'IsLocalTest' })).result

  const partTpl = (await api.v1.assembly.partTemplate({ name: 'Peg' })).result
  await api.v1.part.cylinder({ id: partTpl, name: 'Peg', height: 30, diameter: 8 })

  const subTpl = (await api.v1.assembly.assemblyTemplate({ name: 'PegGroup' })).result

  // Instance the sub-assembly at an offset position
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const subInst = (await api.v1.assembly.instance({
    productId: subTpl, ownerId: asmId, name: 'PegGroup1',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[09] subInst:', subInst, '(placed at x=100)')

  // Add a peg to the sub-assembly instance with isLocal: FALSE (global coords)
  const pegGlobal = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subInst, name: 'PegGlobal',
    transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: false,
  })).result
  console.log('[09] pegGlobal:', pegGlobal, '(global transform: x=120)')

  // Add a peg with isLocal: TRUE (local to the sub-assembly)
  const pegLocal = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subInst, name: 'PegLocal',
    transformation: [[20, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: true,
  })).result
  console.log('[09] pegLocal:', pegLocal, '(local transform: x=20, should appear at global x=120)')

  // Add one at origin with isLocal=true (should appear at global x=100)
  const pegOriginLocal = (await api.v1.assembly.instance({
    productId: partTpl, ownerId: subInst, name: 'PegOriginLocal',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
    isLocal: true,
  })).result
  console.log('[09] pegOriginLocal:', pegOriginLocal, '(local origin, should appear at global x=100)')

  await snapshot('isLocal-test')

  // Get structure to check actual positions
  const r = await api.v1.common.getAppVersion({})
  filewrite(r.structure, 'isLocal-structure')

  return { asmId }
}
