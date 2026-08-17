export default async function (api, { snapshot, filewrite }) {
  // Setup: 2 fastened constraints to test array form update
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 80, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'A' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'B',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'C',
    transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Create two fastened constraints
  const fId1 = (await api.v1.assembly.fastened({
    id: asmId, name: 'F1',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result
  const fId2 = (await api.v1.assembly.fastened({
    id: asmId, name: 'F2',
    mate1: { path: [inst1], csys: wcs },
    mate2: { path: [inst3], csys: wcs },
    xOffset: 100,
  })).result
  console.log('[10] fId1:', fId1, 'fId2:', fId2)

  // Verify initial state
  const m1 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] initial COG:', JSON.stringify(m1.cog))
  // inst1 (40), inst2 (90), inst3 (140). Avg x = (40+90+140)/3 = 90

  // Array form update — update both constraints at once
  const r = await api.v1.assembly.updateFastened([
    { id: fId1, xOffset: 80 },
    { id: fId2, xOffset: 150, zRotation: '90deg' },
  ])
  console.log('[10] batch update result:', JSON.stringify(r.result), 'maxLevel:', r.maxLevel)

  const m2 = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[10] COG after batch update:', JSON.stringify(m2.cog))
  // inst2 now at x=80, COG (120,15,10)
  // inst3 now at x=150 with 90° CCW rotation, COG (-15+150, 40, 10) = (135, 40, 10)
  // Combined: x=(40+120+135)/3≈98.3

  // Verify both states
  const s1 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F1' })).result
  const s2 = (await api.v1.assembly.getFastened({ id: asmId, name: 'F2' })).result
  console.log('[10] F1 xOffset:', s1.xOffset, 'F2 xOffset:', s2.xOffset, 'F2 zRot:', s2.zRotation)

  filewrite({ batch_result: r.result, batch_messages: r.messages, s1, s2, cog: m2.cog }, 'batch-results')
  await snapshot('after-batch')

  return { fId1, fId2 }
}
