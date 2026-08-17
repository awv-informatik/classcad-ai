export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 30, width: 20, height: 15 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst1',
    transformation: [[10, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Fixed reference
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Ref',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const mass0 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG initial:', JSON.stringify(mass0?.cog))

  // Chain 1: translate +20 in X
  await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [[1,0,0,20],[0,1,0,0],[0,0,1,0],[0,0,0,1]],
  })
  const mass1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG after +20X:', JSON.stringify(mass1?.cog))

  // Chain 2: translate +30 in Y
  await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [[1,0,0,0],[0,1,0,30],[0,0,1,0],[0,0,0,1]],
  })
  const mass2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG after +30Y:', JSON.stringify(mass2?.cog))

  // Chain 3: translate +15 in Z
  await api.v1.assembly.transformInstance({
    id: inst1,
    transformation: [[1,0,0,0],[0,1,0,0],[0,0,1,15],[0,0,0,1]],
  })
  const mass3 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[04] COG after +15Z:', JSON.stringify(mass3?.cog))

  await snapshot('after-3-chains')

  // Expected: inst1 started at [10,0,0], then +20X → [30,0,0], +30Y → [30,30,0], +15Z → [30,30,15]
  // inst1 local COG = [15,10,7.5], so world COG = [30+15,30+10,15+7.5] = [45,40,22.5]
  // inst2 world COG = [80+15,10,7.5] = [95,10,7.5]
  // assembly COG = avg = [(45+95)/2, (40+10)/2, (22.5+7.5)/2] = [70, 25, 15]
  console.log('[04] expected final assembly COG: [70, 25, 15]')

  filewrite({
    cog0: mass0?.cog,
    cog1: mass1?.cog,
    cog2: mass2?.cog,
    cog3: mass3?.cog,
  }, 'results')

  return { asmId, inst1, inst2 }
}
