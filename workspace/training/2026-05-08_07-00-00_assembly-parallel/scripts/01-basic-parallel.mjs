export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // inst2 placed at [40, 30, 25] — will parallel preserve or reset this?
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[40, 30, 25], [1, 0, 0], [0, 1, 0]]
  })).result

  // COG before constraint — .cog field
  const cogBefore = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG before:', JSON.stringify(cogBefore?.cog))

  // Ground the base
  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create basic parallel — no limits
  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'Par1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })
  console.log('[01] parallel result:', r.result, 'maxLevel:', r.maxLevel)

  // COG after
  const cogAfter = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[01] COG after:', JSON.stringify(cogAfter?.cog))

  // Block local COG = [15, 10, 7.5]
  // If preserved: world COG ≈ [55, 40, 32.5]
  // If reset to 0: world COG ≈ [15, 10, 7.5]

  filewrite({ cogBefore: cogBefore?.cog, cogAfter: cogAfter?.cog, constraintId: r.result }, 'basic-cog')
  await snapshot('basic-parallel')
  return { asmId, inst1, inst2, parId: r.result, wcsA, wcsB, tplA, tplB }
}
