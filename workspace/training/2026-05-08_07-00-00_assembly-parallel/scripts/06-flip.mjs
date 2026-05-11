export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 80, width: 60, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 40, width: 20, height: 10 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplB, ownerId: asmId, name: 'Block',
    transformation: [[0, 0, 15], [1, 0, 0], [0, 1, 0]]
  })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Test flip '-Z' — should flip inst2 upside down
  // Lock all DOFs so we can isolate flip effect
  const r = await api.v1.assembly.parallel({
    id: asmId,
    name: 'FlipTest',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB, flip: '-Z' },
    xOffsetLimits: { min: 0, max: 0 },
    yOffsetLimits: { min: 0, max: 0 },
    zOffsetLimits: { min: 15, max: 15 },
    zRotationLimits: { min: 0, max: 0 },
  })
  console.log('[06] parallel result:', r.result, 'maxLevel:', r.maxLevel)

  const cog = (await api.v1.part.calculateMassProperties({ id: inst2 })).result
  console.log('[06] COG with flip -Z:', JSON.stringify(cog?.cog))
  // Block local COG = [20, 10, 5]
  // Flip -Z = 180° around X: [x, -y, -z] -> [20, -10, -5]
  // With z locked at 15: world = [20, -10, 15-5] = [20, -10, 10]?
  // Actually flip happens before positioning. Let me just observe.

  filewrite({ cog: cog?.cog, constraintId: r.result }, 'flip-cog')
  await snapshot('flip-negZ')
  return { asmId }
}
