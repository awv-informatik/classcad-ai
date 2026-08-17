export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Place seed at X=80 offset so the pattern is visible around the origin
  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Seed',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcsId } })

  // Measure seed position
  const seedMp = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  console.log('[07] seed COG:', JSON.stringify(seedMp?.cog))

  // Create circular pattern: 4 instances, 90° apart (PI/2 rad)
  const r = await api.v1.assembly.circularPattern({
    id: asmId,
    instanceId: inst1,
    name: 'CP1',
    mate1: { path: [inst1], csys: wcsId },
    instanceCount: 4,
    angle: Math.PI / 2
  })
  console.log('[07] circularPattern result:', JSON.stringify(r.result))
  console.log('[07] maxLevel:', r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages?.filter(m => m.level > 31)))

  if (r.result?.instances) {
    console.log('[07] total instances:', r.result.instances.length)
    for (const instId of r.result.instances) {
      const mp = (await api.v1.part.calculateMassProperties({ id: instId })).result
      console.log(`[07] inst ${instId} COG:`, JSON.stringify(mp?.cog))
    }
  }

  filewrite(r.result, 'cp-result')

  // Also test with degree string angle
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Seed2',
    transformation: [[0, 80, 50], [1, 0, 0], [0, 1, 0]]
  })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst2, name: 'FO2', mate1: { path: [inst2], csys: wcsId } })
  const r2 = await api.v1.assembly.circularPattern({
    id: asmId,
    instanceId: inst2,
    name: 'CP2',
    mate1: { path: [inst2], csys: wcsId },
    instanceCount: 6,
    angle: '60deg'
  })
  console.log('[07] degStr result:', JSON.stringify(r2.result))
  if (r2.result?.instances) {
    console.log('[07] degStr instances:', r2.result.instances.length)
  }

  await snapshot('circular-iso')
  await snapshot('circular-top', { view: 'top' })

  return { asmId }
}
