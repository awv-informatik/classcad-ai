export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Seed' })).result
  console.log('[02] seed instance ID:', inst1)
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcsId } })

  // count=3 — does that mean 3 copies (4 total) or 3 total (seed + 2 copies)?
  const r = await api.v1.assembly.linearPattern({
    id: asmId,
    instanceId: inst1,
    name: 'LP1',
    mate1: { path: [inst1], csys: wcsId },
    dir1: { count: 3, distance: 60 }
  })
  console.log('[02] constraint:', r.result.constraint)
  console.log('[02] instances:', JSON.stringify(r.result.instances))
  console.log('[02] seed in instances?', r.result.instances.includes(inst1))

  // Use getInstance to read each instance's transform
  for (const instId of r.result.instances) {
    const gi = await api.v1.assembly.getInstance({ id: instId })
    console.log(`[02] getInstance(${instId}):`, JSON.stringify(gi.result))
  }

  // Also read the seed instance transform
  const seedGi = await api.v1.assembly.getInstance({ id: inst1 })
  console.log('[02] seed getInstance:', JSON.stringify(seedGi.result))

  // Test count=1 — should create 1 copy
  const inst2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Seed2', transformation: [[0, 200, 0], [1, 0, 0], [0, 1, 0]] })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst2, name: 'FO2', mate1: { path: [inst2], csys: wcsId } })
  const r2 = await api.v1.assembly.linearPattern({
    id: asmId,
    instanceId: inst2,
    name: 'LP2',
    mate1: { path: [inst2], csys: wcsId },
    dir1: { count: 1, distance: 80 }
  })
  console.log('[02] count=1 instances:', JSON.stringify(r2.result?.instances))
  console.log('[02] count=1 instances length:', r2.result?.instances?.length)

  filewrite({ lp1: r.result, lp2: r2.result, seedId: inst1 }, 'count-semantics')

  await snapshot('count-test')
  return { asmId }
}
