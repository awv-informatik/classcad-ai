export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  const revId = (await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 12,
  })).result

  // Query by assembly ID (known working)
  const r1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Hinge1' })
  console.log('[05] by assembly ID — result id:', r1.result?.id, 'maxLevel:', r1.maxLevel, '✓')

  // Query by instance ID (mate1)
  const r2 = await api.v1.assembly.getRevolute({ id: inst1, name: 'Hinge1' })
  console.log('[05] by inst1 ID — result:', r2.result?.id ?? r2.result, 'maxLevel:', r2.maxLevel)

  // Query by instance ID (mate2)
  const r3 = await api.v1.assembly.getRevolute({ id: inst2, name: 'Hinge1' })
  console.log('[05] by inst2 ID — result:', r3.result?.id ?? r3.result, 'maxLevel:', r3.maxLevel)

  // Query by template ID
  const r4 = await api.v1.assembly.getRevolute({ id: tplA, name: 'Hinge1' })
  console.log('[05] by template ID — result:', r4.result?.id ?? r4.result, 'maxLevel:', r4.maxLevel)

  filewrite({
    byAssembly: { result: r1.result?.id, maxLevel: r1.maxLevel },
    byInst1: { result: r2.result?.id ?? r2.result, maxLevel: r2.maxLevel },
    byInst2: { result: r3.result?.id ?? r3.result, maxLevel: r3.maxLevel },
    byTemplate: { result: r4.result?.id ?? r4.result, maxLevel: r4.maxLevel },
  }, 'id-variants')

  return { revId }
}
