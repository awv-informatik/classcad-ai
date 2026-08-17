export default async function (api, { snapshot, filewrite }) {
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
    transformation: [[50, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const inst3 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'C',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before')
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[08] COG before:', JSON.stringify(massBefore?.cog))

  // Batch transform: move each instance differently
  const r = await api.v1.assembly.transformInstance([
    { id: inst1, transformation: [[1,0,0,0],[0,1,0,30],[0,0,1,0],[0,0,0,1]] },  // +30Y
    { id: inst2, transformation: [[1,0,0,0],[0,1,0,60],[0,0,1,0],[0,0,0,1]] },  // +60Y
    { id: inst3, transformation: [[1,0,0,0],[0,1,0,90],[0,0,1,0],[0,0,0,1]] },  // +90Y
  ])
  console.log('[08] batch result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[08] batch messages:', JSON.stringify(r.messages))

  await snapshot('after-batch')
  const massAfter = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[08] COG after batch:', JSON.stringify(massAfter?.cog))

  // Expected: A at [0,30,0], B at [50,60,0], C at [100,90,0]
  // COGs: [15,40,7.5], [65,70,7.5], [115,100,7.5]
  // Avg: [(15+65+115)/3, (40+70+100)/3, 7.5] = [65, 70, 7.5]
  console.log('[08] expected COG: [65, 70, 7.5]')

  filewrite({
    batchResult: { result: r.result, maxLevel: r.maxLevel, messages: r.messages },
    cogBefore: massBefore?.cog,
    cogAfter: massAfter?.cog,
  }, 'results')

  return { asmId }
}
