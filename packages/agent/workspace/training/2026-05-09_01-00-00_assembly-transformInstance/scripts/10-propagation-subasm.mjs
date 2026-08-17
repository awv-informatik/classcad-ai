export default async function (api, { snapshot, filewrite }) {
  // Test the doc claim: "the same other instances and the template will also be transformed"
  // Use a sub-assembly with two instances of the same template, transform one
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Sub-assembly template with two instances of Block
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'Pair' })).result
  const childA = (await api.v1.assembly.instance({
    productId: tplId, ownerId: subTplId, name: 'ChildA',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const childB = (await api.v1.assembly.instance({
    productId: tplId, ownerId: subTplId, name: 'ChildB',
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create TWO instances of the sub-assembly (to check cross-instance propagation)
  const subInst1 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: asmId, name: 'PairInst1',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const subInst2 = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: asmId, name: 'PairInst2',
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before')
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG before:', JSON.stringify(massBefore?.cog))

  // Get expanded-tree children of subInst1
  const children1 = (await api.v1.assembly.getInstance({ ownerId: subInst1 })).result
  console.log('[10] subInst1 children:', JSON.stringify(children1))

  // Get expanded-tree children of subInst2
  const children2 = (await api.v1.assembly.getInstance({ ownerId: subInst2 })).result
  console.log('[10] subInst2 children:', JSON.stringify(children2))

  // Transform ONLY the first child of subInst1 by +40Y
  const targetChild = Array.isArray(children1) ? children1[0] : children1
  const r = await api.v1.assembly.transformInstance({
    id: targetChild,
    transformation: [[1,0,0,0],[0,1,0,40],[0,0,1,0],[0,0,0,1]],
  })
  console.log('[10] transform result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[10] messages:', JSON.stringify(r.messages))

  await snapshot('after-transform-child')
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG after:', JSON.stringify(massAfter?.cog))

  filewrite({
    subInst1, subInst2,
    children1, children2,
    targetChild,
    cogBefore: massBefore?.cog,
    cogAfter: massAfter?.cog,
  }, 'results')

  return { asmId }
}
