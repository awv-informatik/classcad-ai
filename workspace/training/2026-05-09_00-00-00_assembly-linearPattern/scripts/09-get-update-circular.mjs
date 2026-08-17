export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Seed',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcsId } })

  // Create circular pattern: 3 copies at 120° each
  const r = await api.v1.assembly.circularPattern({
    id: asmId,
    instanceId: inst1,
    name: 'CP1',
    mate1: { path: [inst1], csys: wcsId },
    instanceCount: 3,
    angle: '120deg'
  })
  console.log('[09] created CP:', JSON.stringify(r.result))

  // Get it back
  const g = await api.v1.assembly.getCircularPattern({ id: asmId, name: 'CP1' })
  console.log('[09] getCircularPattern:', JSON.stringify(g.result))
  filewrite(g.result, 'get-cp-result')

  // Non-existent
  const g2 = await api.v1.assembly.getCircularPattern({ id: asmId, name: 'Nope' })
  console.log('[09] nonexistent:', JSON.stringify(g2.result), 'maxLevel:', g2.maxLevel)

  await snapshot('before-update')

  // Update: change to 5 copies at 72° each
  const constraintId = r.result.constraint
  const u = await api.v1.assembly.updateCircularPattern({
    id: constraintId,
    instanceCount: 5,
    angle: '72deg'
  })
  console.log('[09] update result:', JSON.stringify(u.result))
  console.log('[09] update maxLevel:', u.maxLevel)

  // Verify updated state
  const g3 = await api.v1.assembly.getCircularPattern({ id: asmId, name: 'CP1' })
  console.log('[09] after update get:', JSON.stringify(g3.result))

  // Measure positions
  if (u.result?.instances) {
    for (const instId of u.result.instances) {
      const mp = (await api.v1.part.calculateMassProperties({ id: instId })).result
      console.log(`[09] inst ${instId} COG:`, JSON.stringify(mp?.cog))
    }
  }

  filewrite({ created: r.result, updated: u.result, getAfter: g3.result }, 'update-cp-data')

  await snapshot('after-update')

  return { asmId }
}
