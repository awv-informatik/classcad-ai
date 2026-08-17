export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Seed' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcsId } })

  const r = await api.v1.assembly.linearPattern({
    id: asmId,
    instanceId: inst1,
    name: 'MyLP',
    mate1: { path: [inst1], csys: wcsId },
    dir1: { count: 4, distance: 50 }
  })
  console.log('[05] created LP:', JSON.stringify(r.result))

  // Now retrieve it by name
  const g = await api.v1.assembly.getLinearPattern({ id: asmId, name: 'MyLP' })
  console.log('[05] getLinearPattern result:', JSON.stringify(g.result))
  console.log('[05] maxLevel:', g.maxLevel)

  filewrite(g.result, 'get-lp-result')

  // Try getting a non-existent name
  const g2 = await api.v1.assembly.getLinearPattern({ id: asmId, name: 'Nonexistent' })
  console.log('[05] nonexistent:', JSON.stringify(g2.result), 'maxLevel:', g2.maxLevel)

  return { asmId }
}
