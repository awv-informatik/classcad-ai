export default async function (api, { snapshot, filewrite }) {
  // Two root-level instances of the same template — transform one, verify other doesn't move
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'A',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'B',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const cog0 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG before:', JSON.stringify(cog0?.cog))
  // Expected: avg of [15,10,7.5] and [75,10,7.5] = [45, 10, 7.5]

  await snapshot('before')

  // Transform inst1 to [0, 50, 0]
  await api.v1.assembly.transformInstanceTo({
    id: inst1,
    transformation: [[0, 50, 0], [1, 0, 0], [0, 1, 0]],
  })

  const cog1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG after transforming inst1 only:', JSON.stringify(cog1?.cog))
  // If no propagation: inst1 COG=[15,60,7.5], inst2 COG=[75,10,7.5], avg=[45, 35, 7.5]
  // If propagation: both at y=60, avg y=60

  await snapshot('after')

  filewrite({
    cogBefore: cog0?.cog,
    cogAfter: cog1?.cog,
    expectedNoPropagation: { x: 45, y: 35, z: 7.5 },
    expectedWithPropagation: { x: 45, y: 60, z: 7.5 },
  }, 'root-propagation-test')

  return { inst1, inst2, asmId }
}
