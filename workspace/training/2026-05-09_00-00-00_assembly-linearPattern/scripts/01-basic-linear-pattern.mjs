export default async function (api, { snapshot, filewrite }) {
  // Create assembly with a part template containing a box + WCS
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })).result
  const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create a seed instance and ground it
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Seed' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcsId } })

  // Create linear pattern: 3 copies along X with 60mm spacing
  const r = await api.v1.assembly.linearPattern({
    id: asmId,
    instanceId: inst1,
    name: 'LP1',
    mate1: { path: [inst1], csys: wcsId },
    dir1: { count: 3, distance: 60 }
  })
  console.log('[01] linearPattern result:', JSON.stringify(r.result))
  console.log('[01] maxLevel:', r.maxLevel)
  console.log('[01] messages:', JSON.stringify(r.messages?.filter(m => m.level > 31)))

  filewrite(r.result, 'lp-result')

  // Verify: how many instances were created?
  if (r.result && r.result.instances) {
    console.log('[01] constraint ID:', r.result.constraint)
    console.log('[01] instances created:', r.result.instances.length)
    console.log('[01] instance IDs:', JSON.stringify(r.result.instances))
  }

  // Measure COG of each pattern instance to verify spacing
  if (r.result && r.result.instances) {
    for (let i = 0; i < r.result.instances.length; i++) {
      const instId = r.result.instances[i]
      const mp = await api.v1.assembly.calculateMassProperties({ id: instId })
      console.log(`[01] pattern inst[${i}] id=${instId} COG:`, JSON.stringify(mp.result?.centerOfGravity))
    }
  }

  // Also measure the seed instance COG for reference
  const seedMp = await api.v1.assembly.calculateMassProperties({ id: inst1 })
  console.log('[01] seed inst COG:', JSON.stringify(seedMp.result?.centerOfGravity))

  await snapshot('linear-pattern-3x')
  await snapshot('linear-pattern-3x-top', { view: 'top' })

  return { asmId, inst1, lpResult: r.result }
}
