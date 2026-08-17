export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BatchIdent' })).result

  const tplId = (await api.v1.assembly.partTemplate({ name: 'Box' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 40, width: 30, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Test 1: instance creation with ident param (inline, no setIdent needed)
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1', ident: 'part_a'
  })).result
  console.log('[07] inst1 with ident at creation:', inst1)

  // Verify the ident works — use transformInstance which accepts idents
  const tr = await api.v1.assembly.transformInstance({
    id: 'part_a',
    transformation: [[1, 0, 0, 30], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[07] transformInstance(part_a):', tr.maxLevel)

  // Test 2: assembly.create with ident param
  // Already tested creating assembly with name — does create() accept ident?
  // Actually the docs show [param.ident] as optional on assembly.create
  // But we already created one, let me test setIdent batch form

  // Test 3: batch form of setIdent — param accepts Array<object>
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst3',
    transformation: [[0, 80, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[07] inst2:', inst2, 'inst3:', inst3)

  const batch = await api.v1.assembly.setIdent([
    { id: inst2, ident: 'part_b' },
    { id: inst3, ident: 'part_c' }
  ])
  console.log('[07] batch setIdent:', batch.result, 'maxLevel:', batch.maxLevel)
  filewrite({ result: batch.result, messages: batch.messages, maxLevel: batch.maxLevel }, 'batch-setIdent')

  // Verify batch-set idents work
  const tr2 = await api.v1.assembly.transformInstance({
    id: 'part_b',
    transformation: [[1, 0, 0, 10], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  const tr3 = await api.v1.assembly.transformInstance({
    id: 'part_c',
    transformation: [[1, 0, 0, 0], [0, 1, 0, 10], [0, 0, 1, 0], [0, 0, 0, 1]]
  })
  console.log('[07] transform part_b:', tr2.maxLevel, 'part_c:', tr3.maxLevel)

  // Verify COGs
  const mp1 = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  const mp2 = await api.v1.assembly.calculateMassProperties({ id: inst2 })
  const mp3 = await api.v1.assembly.calculateMassProperties({ id: inst3 })
  console.log('[07] inst1 COG:', JSON.stringify(mp1.result?.cog))
  console.log('[07] inst2 COG:', JSON.stringify(mp2.result?.cog))
  console.log('[07] inst3 COG:', JSON.stringify(mp3.result?.cog))

  await snapshot('batch-ident')

  return { asmId }
}
