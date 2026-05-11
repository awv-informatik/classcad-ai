export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Seed' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcsId } })

  // 2D grid: 3 along dir1, 2 along dir2, with both needing mate2
  // dir1 default direction is Z (mate1 flip="Z")
  // dir2 needs mate2 — what's the direction?
  const r = await api.v1.assembly.linearPattern({
    id: asmId,
    instanceId: inst1,
    name: 'Grid',
    mate1: { path: [inst1], csys: wcsId },
    dir1: { count: 3, distance: 60 },
    mate2: { path: [inst1], csys: wcsId, flip: 'X' },
    dir2: { count: 2, distance: 50 }
  })
  console.log('[04] grid result:', JSON.stringify(r.result))
  console.log('[04] maxLevel:', r.maxLevel)
  console.log('[04] messages:', JSON.stringify(r.messages?.filter(m => m.level > 31)))

  if (r.result?.instances) {
    console.log('[04] total instances:', r.result.instances.length)
    // Expected: count1 * count2 = 3*2 = 6? Or (count1-1)*(count2-1)+1 or similar?

    for (const instId of r.result.instances) {
      const mp = (await api.v1.part.calculateMassProperties({ id: instId })).result
      console.log(`[04] inst ${instId} COG:`, JSON.stringify(mp?.cog))
    }
  }

  filewrite(r.result, 'grid-result')

  await snapshot('grid-iso')
  await snapshot('grid-front', { view: 'front' })

  return { asmId }
}
