export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 100, width: 80, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Slider' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 30, width: 20, height: 15 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Slider' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const planarId = (await api.v1.assembly.planar({
    id: asmId,
    name: 'TestPlanar',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 10,
  })).result

  const errors = {}

  // Error 1: pass assembly ID instead of constraint ID
  const r1 = await api.v1.assembly.updatePlanar({ id: asmId, zOffset: 20 })
  console.log('[09] assembly ID as constraint ID:', r1.result, 'maxLevel:', r1.maxLevel)
  errors.assemblyIdAsConstraintId = { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }

  // Error 2: pass bogus ID
  const r2 = await api.v1.assembly.updatePlanar({ id: 99999, zOffset: 20 })
  console.log('[09] bogus ID:', r2.result, 'maxLevel:', r2.maxLevel)
  errors.bogusId = { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }

  // Error 3: getPlanar with wrong assembly ID type
  const r3 = await api.v1.assembly.getPlanar({ id: 99999, name: 'TestPlanar' })
  console.log('[09] getPlanar bogus assembly ID:', r3.result, 'maxLevel:', r3.maxLevel)
  errors.getPlanarBogusId = { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }

  // Verify constraint still works after errors
  const getR = await api.v1.assembly.getPlanar({ id: asmId, name: 'TestPlanar' })
  console.log('[09] constraint intact after errors:', getR.result !== null, 'zOffset:', getR.result?.zOffset)

  filewrite(errors, 'error-cases')

  return { planarId }
}
