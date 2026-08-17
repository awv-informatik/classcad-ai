export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tpl1, name: 'B1', length: 40, width: 30, height: 20 })
  const wcs1 = (await api.v1.part.workCSys({ id: tpl1, name: 'WCS1', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tpl2, name: 'B2', length: 60, width: 20, height: 15 })
  const wcs2 = (await api.v1.part.workCSys({ id: tpl2, name: 'WCS2', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst1 = (await api.v1.assembly.instance({ productId: tpl1, ownerId: asmId, name: 'I1' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl2, ownerId: asmId, name: 'I2' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'FO1', mate1: { path: [inst1], csys: wcs1 } })

  const revId = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'Rev_Test',
    mate1: { path: [inst1], csys: wcs1 },
    mate2: { path: [inst2], csys: wcs2 },
  })).result

  // Normal: assembly ID (should work)
  const r1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Rev_Test' })
  console.log('[05] assembly ID:', r1.result ? 'OK' : 'FAIL', 'maxLevel:', r1.maxLevel)

  // Part instance ID (inst1 is an instance of a PART template)
  const r2 = await api.v1.assembly.getRevolute({ id: inst1, name: 'Rev_Test' })
  console.log('[05] part instance ID result:', r2.result)
  console.log('[05] part instance maxLevel:', r2.maxLevel)
  console.log('[05] part instance messages:', JSON.stringify(r2.messages))

  // Constraint ID
  const r3 = await api.v1.assembly.getRevolute({ id: revId, name: 'Rev_Test' })
  console.log('[05] constraint ID result:', r3.result)
  console.log('[05] constraint maxLevel:', r3.maxLevel)
  console.log('[05] constraint messages:', JSON.stringify(r3.messages))

  // Part template ID
  const r4 = await api.v1.assembly.getRevolute({ id: tpl1, name: 'Rev_Test' })
  console.log('[05] part template ID result:', r4.result)
  console.log('[05] part template maxLevel:', r4.maxLevel)
  console.log('[05] part template messages:', JSON.stringify(r4.messages))

  filewrite({
    assemblyId: { ok: r1.result !== null, maxLevel: r1.maxLevel },
    partInstanceId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    constraintId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    partTemplateId: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'wrong-id-types')

  return { asmId }
}
