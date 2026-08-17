export default async function (api, { snapshot, filewrite }) {
  // Same setup as 05 but using isLocal: TRUE
  const asmId = (await api.v1.assembly.create({})).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const childInst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: subTplId, name: 'Child',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Sub-assembly instance rotated 90° Z at [50, 50, 0]
  const subInst = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: asmId, name: 'SubInst',
    transformation: [
      [0, -1, 0, 50],
      [1,  0, 0, 50],
      [0,  0, 1, 0],
      [0,  0, 0, 1],
    ],
  })).result

  const refInst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Ref',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before')
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG before:', JSON.stringify(massBefore?.cog))

  const childET = (await api.v1.assembly.getInstance({ ownerId: subInst })).result
  const childETId = Array.isArray(childET) ? childET[0] : childET
  console.log('[06] childETId:', childETId)

  // Transform the child with isLocal: TRUE — translate +30 in LOCAL X
  // Since sub-assembly is rotated 90° Z, local X maps to world Y
  const r1 = await api.v1.assembly.transformInstance({
    id: childETId,
    transformation: [[1,0,0,30],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
    isLocal: true,
  })
  console.log('[06] isLocal transform result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[06] messages:', JSON.stringify(r1.messages))

  await snapshot('after-local-translate')
  const massAfterLocal = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[06] COG after local +30X:', JSON.stringify(massAfterLocal?.cog))

  filewrite({
    subInst, childETId,
    cogBefore: massBefore?.cog,
    cogAfterLocal: massAfterLocal?.cog,
    localResult: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
  }, 'results')

  return { asmId }
}
