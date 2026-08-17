export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'NestedAsm' })).result

  // Create an assembly template with parts inside
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'Gearbox' })).result

  // Create two part templates
  const gearTplId = (await api.v1.assembly.partTemplate({ name: 'Gear' })).result
  await api.v1.part.cylinder({ id: gearTplId, name: 'Body', height: 10, diameter: 30 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const shaftTplId = (await api.v1.assembly.partTemplate({ name: 'Shaft' })).result
  await api.v1.part.cylinder({ id: shaftTplId, name: 'Rod', height: 50, diameter: 8 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Add parts to the assembly template
  await api.v1.assembly.setCurrentProduct({ id: subTplId })
  await api.v1.assembly.instance({ productId: gearTplId, ownerId: subTplId, name: 'Gear1' })
  await api.v1.assembly.instance({ productId: shaftTplId, ownerId: subTplId, name: 'Shaft1',
    transformation: [[0, 0, -20], [1, 0, 0], [0, 1, 0]] })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the assembly template in the root — creates nested structure
  const gb1 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: asmId, name: 'GearboxA',
  })).result
  console.log('[11] gearbox instance 1:', gb1)

  const gb2 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: asmId, name: 'GearboxB',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[11] gearbox instance 2:', gb2)

  // Check children of assembly instances (should have expanded-tree children)
  const gb1Children = (await api.v1.assembly.getInstance({ ownerId: gb1 })).result
  const gb2Children = (await api.v1.assembly.getInstance({ ownerId: gb2 })).result
  console.log('[11] gb1 children:', gb1Children)
  console.log('[11] gb2 children:', gb2Children)

  // Also check template's own instances
  const tplChildren = (await api.v1.assembly.getInstance({ ownerId: subTplId })).result
  console.log('[11] template children:', tplChildren)

  filewrite({
    gb1, gb2, gb1Children, gb2Children, tplChildren,
  }, 'nested-structure')

  await snapshot('nested-gearbox')
  return { asmId }
}
