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

  // Circular pattern with offset — should produce a helix-like arrangement
  const r = await api.v1.assembly.circularPattern({
    id: asmId,
    instanceId: inst1,
    name: 'Helix',
    mate1: { path: [inst1], csys: wcsId },
    instanceCount: 6,
    angle: Math.PI / 3,  // 60° between each
    offset: 25           // 25mm along Z between each
  })
  console.log('[08] helix result:', JSON.stringify(r.result))
  console.log('[08] maxLevel:', r.maxLevel)

  if (r.result?.instances) {
    console.log('[08] total instances:', r.result.instances.length)
    for (const instId of r.result.instances) {
      const mp = (await api.v1.part.calculateMassProperties({ id: instId })).result
      console.log(`[08] inst ${instId} COG:`, JSON.stringify(mp?.cog))
    }
  }

  filewrite(r.result, 'helix-result')

  await snapshot('helix-iso')
  await snapshot('helix-front', { view: 'front' })

  return { asmId }
}
