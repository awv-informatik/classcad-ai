export default async function (api, { snapshot, filewrite }) {
  // Test: can instance() accept a string name as productId?
  const asmId = (await api.v1.assembly.create({ name: 'NameTest' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.part.box({ id: tplId, name: 'Body', length: 50, width: 30, height: 20 })

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance by numeric ID (known to work)
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'ByID'
  })).result
  console.log('[05] inst by numeric ID:', inst1)

  // Instance by string name
  const inst2r = await api.v1.assembly.instance({
    productId: 'Bracket', ownerId: asmId, name: 'ByName',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]]
  })
  console.log('[05] inst by string name maxLevel:', inst2r.maxLevel, 'result:', inst2r.result)
  if (inst2r.messages?.length) console.log('[05] messages:', JSON.stringify(inst2r.messages))

  // Instance by wrong name
  const inst3r = await api.v1.assembly.instance({
    productId: 'NonExistent', ownerId: asmId, name: 'Bad'
  })
  console.log('[05] inst by wrong name maxLevel:', inst3r.maxLevel, 'result:', inst3r.result)
  if (inst3r.messages?.length) console.log('[05] messages:', JSON.stringify(inst3r.messages))

  // Also test: ownerId as string? (the assembly's name)
  const inst4r = await api.v1.assembly.instance({
    productId: tplId, ownerId: 'NameTest', name: 'OwnerByName',
    transformation: [[0, 60, 0], [1, 0, 0], [0, 1, 0]]
  })
  console.log('[05] ownerId as string maxLevel:', inst4r.maxLevel, 'result:', inst4r.result)
  if (inst4r.messages?.length) console.log('[05] messages:', JSON.stringify(inst4r.messages))

  filewrite({
    byId: inst1,
    byName: { maxLevel: inst2r.maxLevel, result: inst2r.result, messages: inst2r.messages },
    wrongName: { maxLevel: inst3r.maxLevel, result: inst3r.result, messages: inst3r.messages },
    ownerByName: { maxLevel: inst4r.maxLevel, result: inst4r.result, messages: inst4r.messages }
  }, 'productId-by-name')

  if (inst2r.result) {
    const m = await api.v1.assembly.calculateMassProperties({ id: inst2r.result })
    console.log('[05] by-name instance COG:', JSON.stringify(m.result?.cog))
  }

  await snapshot('name-instances')
  return { asmId, tplId }
}
