export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplId, name: 'Box', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({ id: tplId, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Box is 40x30x20, part.* primitives are corner-aligned, so template COG is at [20, 15, 10]
  const tplMass = (await api.v1.part.calculateMassProperties({ id: tplId })).result
  console.log('[03] template COG:', JSON.stringify(tplMass?.cog))

  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Seed' })).result
  await api.v1.assembly.fastenedOrigin({ id: asmId, instance: inst1, name: 'FO1', mate1: { path: [inst1], csys: wcsId } })

  // Create linear pattern: 3 copies, 60mm apart along X (csys Z-axis direction)
  const r = await api.v1.assembly.linearPattern({
    id: asmId,
    instanceId: inst1,
    name: 'LP1',
    mate1: { path: [inst1], csys: wcsId },
    dir1: { count: 3, distance: 60 }
  })

  // Seed + 2 new copies should exist. dir1 with default flip="Z" — direction along Z-axis
  // Expected positions: seed at origin, copy1 at Z+60, copy2 at Z+120
  // Or along X? Need to measure to find out.

  // Measure COG of each instance
  const allInstances = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[03] all instances:', JSON.stringify(allInstances))

  const cogData = []
  for (const instId of (Array.isArray(allInstances) ? allInstances : [allInstances])) {
    const mp = (await api.v1.part.calculateMassProperties({ id: instId })).result
    console.log(`[03] inst ${instId} COG:`, JSON.stringify(mp?.cog))
    cogData.push({ id: instId, cog: mp?.cog })
  }

  filewrite({ patternResult: r.result, allInstances, cogData }, 'spatial-data')

  await snapshot('spatial-iso')
  await snapshot('spatial-front', { view: 'front' })

  return { asmId }
}
