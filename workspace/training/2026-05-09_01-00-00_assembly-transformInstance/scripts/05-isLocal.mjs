export default async function (api, { snapshot, filewrite }) {
  // Setup: assembly → sub-assembly (rotated 90° Z) → instance inside
  // Test: isLocal TRUE vs FALSE when transforming the sub-assembly's child
  const asmId = (await api.v1.assembly.create({})).result

  // Part template with an elongated box
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Sub-assembly template
  const subTplId = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  // Add a part instance inside the sub-assembly template
  const childInst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: subTplId, name: 'Child',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create sub-assembly instance rotated 90° around Z at position [50, 50, 0]
  const subInst = (await api.v1.assembly.instance({
    productId: subTplId, ownerId: asmId, name: 'SubInst',
    transformation: [
      [0, -1, 0, 50],
      [1,  0, 0, 50],
      [0,  0, 1, 0],
      [0,  0, 0, 1],
    ],
  })).result

  // Also a fixed reference block at origin
  const refInst = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Ref',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  await snapshot('before')
  const massBefore = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] COG before:', JSON.stringify(massBefore?.cog))

  // Get the expanded-tree child instance ID
  const childET = (await api.v1.assembly.getInstance({ ownerId: subInst })).result
  console.log('[05] childET instances:', JSON.stringify(childET))
  const childETId = Array.isArray(childET) ? childET[0] : childET

  // Transform the child with isLocal: FALSE (global) — translate +30 in world X
  const r1 = await api.v1.assembly.transformInstance({
    id: childETId,
    transformation: [[1,0,0,30],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
    isLocal: false,
  })
  console.log('[05] global transform result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[05] global messages:', JSON.stringify(r1.messages))

  await snapshot('after-global-translate')
  const massAfterGlobal = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[05] COG after global +30X:', JSON.stringify(massAfterGlobal?.cog))

  filewrite({
    subInst, childETId, refInst,
    cogBefore: massBefore?.cog,
    cogAfterGlobal: massAfterGlobal?.cog,
    globalResult: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
  }, 'results')

  return { asmId }
}
