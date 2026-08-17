export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'BatchTest' })).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst2',
  })).result

  const fo1 = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst1], csys: wcs },
    xOffset: 0,
  })).result
  const fo2 = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO2',
    mate1: { path: [inst2], csys: wcs },
    xOffset: 50,
  })).result
  console.log('[07] fo1:', fo1, 'fo2:', fo2)

  await snapshot('before-batch')

  // Batch update
  const r = await api.v1.assembly.updateFastenedOrigin([
    { id: fo1, xOffset: 100, zRotation: '45deg' },
    { id: fo2, yOffset: -30, name: 'FO2_Renamed' },
  ])
  console.log('[07] batch result:', JSON.stringify(r.result))
  console.log('[07] batch maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'batch-response')

  await snapshot('after-batch')

  // Verify both updated
  const s1 = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO1' })).result
  const s2 = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO2_Renamed' })).result
  console.log('[07] fo1 — xOffset:', s1?.xOffset, 'zRotation:', s1?.zRotation)
  console.log('[07] fo2 — yOffset:', s2?.yOffset, 'name:', s2?.name)
  filewrite({ fo1State: s1, fo2State: s2 }, 'batch-verification')

  return { fo1, fo2 }
}
