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

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2', transformation: [[30,0,0],[1,0,0],[0,1,0]] })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl3, ownerId: asmId, name: 'I3', transformation: [[-35,0,0],[1,0,0],[0,1,0]] })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO', mate1: { path: [inst1], csys: wcs1 } })
  const rev1 = (await api.v1.assembly.revolute({ id: asmId, name: 'R1', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst2], csys: wcs2 } })).result
  const rev2 = (await api.v1.assembly.revolute({ id: asmId, name: 'R2', mate1: { path: [inst1], csys: wcs1 }, mate2: { path: [inst3], csys: wcs3 } })).result

  const gearId = (await api.v1.assembly.gear({ id: asmId, name: 'G1', constr1Id: rev1, constr2Id: rev2, ratio: 1 })).result
  const results = []

  // Test various edge ratio values
  const testCases = [
    { ratio: 0, label: 'zero' },
    { ratio: -1, label: 'negative' },
    { ratio: -0.5, label: 'negative-fraction' },
    { ratio: 100000, label: 'very-large' },
    { ratio: 0.001, label: 'very-small' },
    { ratio: -100, label: 'large-negative' },
  ]

  for (const tc of testCases) {
    const upd = await api.v1.assembly.updateGear({ id: gearId, ratio: tc.ratio })
    const after = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
    console.log(`[10] ${tc.label} ratio=${tc.ratio} — result:`, upd.result, 'maxLevel:', upd.maxLevel, 'stored ratio:', after.ratio)
    results.push({ label: tc.label, input: tc.ratio, stored: after.ratio, maxLevel: upd.maxLevel })
  }

  // Also test negative offset update
  const offUpd = await api.v1.assembly.updateGear({ id: gearId, offset: -1.5708 })
  const afterOff = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[10] negative offset -1.5708 — stored:', afterOff.offset, 'maxLevel:', offUpd.maxLevel)
  results.push({ label: 'negative-offset', input: -1.5708, stored: afterOff.offset, maxLevel: offUpd.maxLevel })

  // Test very large offset (> 2*PI)
  const offUpd2 = await api.v1.assembly.updateGear({ id: gearId, offset: 10 })
  const afterOff2 = (await api.v1.assembly.getGear({ id: asmId, name: 'G1' })).result
  console.log('[10] large offset 10 — stored:', afterOff2.offset, 'maxLevel:', offUpd2.maxLevel)
  results.push({ label: 'large-offset', input: 10, stored: afterOff2.offset, maxLevel: offUpd2.maxLevel })

  filewrite(results, 'edge-values')

  return { gearId }
}
