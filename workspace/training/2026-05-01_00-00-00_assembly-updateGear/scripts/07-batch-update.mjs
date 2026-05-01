export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GearAsm' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'W1' })).result
  await api.v1.part.cylinder({ id: tpl1, name: 'C', height: 10, diameter: 40 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'W2' })).result
  await api.v1.part.cylinder({ id: tpl2, name: 'C', height: 10, diameter: 20 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'W3' })).result
  await api.v1.part.cylinder({ id: tpl3, name: 'C', height: 10, diameter: 30 })
  const wcs3 = (await api.v1.part.workCSys({ id: tpl3, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  const tpl4 = (await api.v1.assembly.partTemplate({ name: 'W4' })).result
  await api.v1.part.cylinder({ id: tpl4, name: 'C', height: 10, diameter: 25 })
  const wcs4 = (await api.v1.part.workCSys({ id: tpl4, name: 'A', origin: [0,0,5], xDirection: [1,0,0], yDirection: [0,1,0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2', transformation: [[30,0,0],[1,0,0],[0,1,0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3', transformation: [[-35,0,0],[1,0,0],[0,1,0]] })).result
  const inst4 = (await api.v1.assembly.instance({ productId: tpl4, ownerId: asmId, name: 'I4', transformation: [[0,40,0],[1,0,0],[0,1,0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })

  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'R1', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst2], csys: wcs2 } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'R2', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst3], csys: wcs3 } })).result
  const rev3 = (await api.v1.assembly.revolute({ id: asmId, name: 'R3', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst4], csys: wcs4 } })).result

  const gear1 = (await api.v1.assembly.gear({ id: asmId, name: 'G1', constr1Id: rev1, constr2Id: rev2, ratio: 1 })).result
  const gear2 = (await api.v1.assembly.gear({ id: asmId, name: 'G2', constr1Id: rev1, constr2Id: rev3, ratio: 1 })).result
  console.log('[07] created gears:', gear1, gear2)

  // Batch update — array param
  const batchResult = await api.v1.assembly.updateGear([
    { id: gear1, ratio: 3, offset: '45deg' },
    { id: gear2, ratio: 0.5, name: 'BatchRenamed' },
  ])
  console.log('[07] batch result:', JSON.stringify(batchResult.result))
  console.log('[07] batch maxLevel:', batchResult.maxLevel)

  // Verify both updated
  const info1 = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  const info2 = (await api.v1.assembly.getGear({ id: asmId, name: 'BatchRenamed' })).result
  console.log('[07] gear1 after batch:', JSON.stringify(info1))
  console.log('[07] gear2 after batch:', JSON.stringify(info2))

  filewrite({ batchResult: { result: batchResult.result, maxLevel: batchResult.maxLevel }, info1, info2 }, 'batch-update')

  return { gear1, gear2 }
}
