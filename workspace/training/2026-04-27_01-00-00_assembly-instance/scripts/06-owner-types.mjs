export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'OwnerAsm' })).result

  // Create sub-assembly template with one part inside
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAssembly' })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const partTplId = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
  await api.v1.part.cylinder({ id: partTplId, name: 'Shaft', height: 30, diameter: 8 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const partTpl2Id = (await api.v1.assembly.partTemplate({ name: 'Nut' })).result
  await api.v1.part.box({ id: partTpl2Id, name: 'Body', length: 12, width: 12, height: 6 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Add Bolt to sub-assembly template
  await api.v1.assembly.setCurrentProduct({ id: subTplId })
  const boltInTpl = (await api.v1.assembly.instance({ productId: partTplId, ownerId: subTplId, name: 'BoltInTpl' })).result
  console.log('[06] bolt in template:', boltInTpl)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly twice
  const sub1 = (await api.v1.assembly.instance({ productId: subTplId, ownerId: asmId, name: 'Sub1' })).result
  const sub2 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: asmId, name: 'Sub2',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[06] sub1:', sub1, 'sub2:', sub2)

  // Check children before adding to instance
  const beforeSub1 = (await api.v1.assembly.getInstance({ ownerId: sub1 })).result
  const beforeSub2 = (await api.v1.assembly.getInstance({ ownerId: sub2 })).result
  const beforeTpl = (await api.v1.assembly.getInstance({ ownerId: subTplId })).result
  console.log('[06] before — sub1 children:', beforeSub1)
  console.log('[06] before — sub2 children:', beforeSub2)
  console.log('[06] before — template children:', beforeTpl)

  // Add Nut to sub1 (an INSTANCE, not the template) — should propagate
  const nutResult = await api.v1.assembly.instance({
    productId: partTpl2Id, ownerId: sub1, name: 'NutViaInstance',
    transformation: [[0, 0, 35], [1, 0, 0], [0, 1, 0]],
  })
  console.log('[06] nut added via instance:', nutResult.result, 'maxLevel:', nutResult.maxLevel)

  // Check children after — did it propagate?
  const afterSub1 = (await api.v1.assembly.getInstance({ ownerId: sub1 })).result
  const afterSub2 = (await api.v1.assembly.getInstance({ ownerId: sub2 })).result
  const afterTpl = (await api.v1.assembly.getInstance({ ownerId: subTplId })).result
  console.log('[06] after — sub1 children:', afterSub1)
  console.log('[06] after — sub2 children:', afterSub2)
  console.log('[06] after — template children:', afterTpl)

  filewrite({
    before: { sub1: beforeSub1, sub2: beforeSub2, template: beforeTpl },
    after: { sub1: afterSub1, sub2: afterSub2, template: afterTpl },
  }, 'propagation')

  await snapshot('owner-types')
  return { asmId }
}
