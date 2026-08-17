export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Template A: base plate (60x40x10)
  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  // Template B: slider block (30x20x15) — different shape for visual distinction
  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Place inst1 at origin, inst2 offset in X=50, Y=30, Z=20
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Slider',
    transformation: [[50, 30, 20], [1, 0, 0], [0, 1, 0]]
  })).result

  // Measure COG before constraint
  const cogBefore1 = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const cogBefore2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[01] inst1 COG before:', JSON.stringify(cogBefore1.cog))
  console.log('[01] inst2 COG before:', JSON.stringify(cogBefore2.cog))

  await snapshot('before')

  // Ground inst1
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create basic planar constraint — no offset, no limits
  const r = await api.v1.assembly.planar({
    id: asmId,
    name: 'Planar1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[01] planar result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'planar-response')

  // Measure COG after constraint
  const cogAfter1 = (await api.v1.part.calculateMassProperties({ id: inst1 })).result
  const cogAfter2 = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[01] inst1 COG after:', JSON.stringify(cogAfter1.cog))
  console.log('[01] inst2 COG after:', JSON.stringify(cogAfter2.cog))

  filewrite({
    inst1: { before: cogBefore1.cog, after: cogAfter1.cog },
    inst2: { before: cogBefore2.cog, after: cogAfter2.cog },
    analysis: {
      inst2_x_change: cogAfter2.cog.x - cogBefore2.cog.x,
      inst2_y_change: cogAfter2.cog.y - cogBefore2.cog.y,
      inst2_z_change: cogAfter2.cog.z - cogBefore2.cog.z,
    }
  }, 'cog-comparison')

  await snapshot('after')

  return { asmId, constraintId: r.result, inst1, inst2, wcsA, wcsB, tplA, tplB }
}
