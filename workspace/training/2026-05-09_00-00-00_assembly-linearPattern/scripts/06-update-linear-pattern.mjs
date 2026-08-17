export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Seed' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcsId } })

  // Start with count=2, distance=60
  const r = await api.v1.assembly.linearPattern({
    id: asmId,
    instanceId: inst1,
    name: 'LP1',
    mate1: { path: [inst1], csys: wcsId },
    dir1: { count: 2, distance: 60 }
  })
  console.log('[06] initial LP:', JSON.stringify(r.result))

  // Measure initial positions
  const initialInstances = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  for (const iid of (Array.isArray(initialInstances) ? initialInstances : [])) {
    const mp = (await api.v1.part.calculateMassProperties({ id: iid })).result
    console.log(`[06] initial inst ${iid} COG:`, JSON.stringify(mp?.cog))
  }

  await snapshot('before-update')

  // Update: change count to 4, distance to 40
  const constraintId = r.result.constraint
  const u = await api.v1.assembly.updateLinearPattern({
    id: constraintId,
    dir1: { count: 4, distance: 40 }
  })
  console.log('[06] update result:', JSON.stringify(u.result))
  console.log('[06] update maxLevel:', u.maxLevel)

  // Measure updated positions
  const updatedInstances = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[06] updated instances:', JSON.stringify(updatedInstances))
  for (const iid of (Array.isArray(updatedInstances) ? updatedInstances : [])) {
    const mp = (await api.v1.part.calculateMassProperties({ id: iid })).result
    console.log(`[06] updated inst ${iid} COG:`, JSON.stringify(mp?.cog))
  }

  filewrite({ initial: r.result, update: u.result, updatedInstances }, 'update-data')

  await snapshot('after-update')

  return { asmId }
}
