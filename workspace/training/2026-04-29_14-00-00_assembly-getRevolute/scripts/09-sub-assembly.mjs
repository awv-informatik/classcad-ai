export default async function (api, { snapshot, filewrite }) {
  const rootAsm = (await api.v1.assembly.create({})).result

  // Create a sub-assembly template with two parts + revolute constraint inside
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'PartA' })).result
  await api.v1.part.box({ id: tplA, name: 'BoxA', length: 30, width: 20, height: 15 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'WCSA', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: subAsmTpl })

  const tplB = (await api.v1.assembly.partTemplate({ name: 'PartB' })).result
  await api.v1.part.box({ id: tplB, name: 'BoxB', length: 50, width: 15, height: 10 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'WCSB', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result
  await api.v1.assembly.setCurrentProduct({ id: subAsmTpl })

  const instA = (await api.v1.assembly.instance({ productId: tplA, ownerId: subAsmTpl, name: 'IA' })).result
  const instB = (await api.v1.assembly.instance({ productId: tplB, ownerId: subAsmTpl, name: 'IB' })).result

  await api.v1.assembly.fastenedOrigin({ id: subAsmTpl, name: 'FO_SubA', mate1: { path: [instA], csys: wcsA } })
  const subRev = (await api.v1.assembly.revolute({
    id: subAsmTpl,
    name: 'SubRev',
    mate1: { path: [instA], csys: wcsA },
    mate2: { path: [instB], csys: wcsB },
    zOffset: 42,
  })).result
  console.log('[09] sub-assembly revolute created:', subRev)

  // Return to root assembly, instance the sub-assembly
  await api.v1.assembly.setCurrentProduct({ id: rootAsm })
  const subAsmInst = (await api.v1.assembly.instance({ productId: subAsmTpl, ownerId: rootAsm, name: 'SubAsmInst' })).result

  // Test 1: Get from sub-assembly template — should work
  const r1 = await api.v1.assembly.getRevolute({ id: subAsmTpl, name: 'SubRev' })
  console.log('[09] from sub-asm template:', r1.result ? 'OK' : 'FAIL', 'maxLevel:', r1.maxLevel)
  console.log('[09] zOffset:', r1.result?.zOffset)

  // Test 2: Get from root assembly — should FAIL (constraint scoped to sub-asm)
  const r2 = await api.v1.assembly.getRevolute({ id: rootAsm, name: 'SubRev' })
  console.log('[09] from root assembly:', r2.result, 'maxLevel:', r2.maxLevel)

  // Test 3: Get from sub-assembly instance ID — should this work?
  const r3 = await api.v1.assembly.getRevolute({ id: subAsmInst, name: 'SubRev' })
  console.log('[09] from sub-asm instance:', r3.result ? 'OK' : 'FAIL', 'maxLevel:', r3.maxLevel)
  if (r3.result) console.log('[09] instance id result zOffset:', r3.result.zOffset)

  await snapshot('sub-asm')

  filewrite({
    fromTemplate: { ok: r1.result !== null, maxLevel: r1.maxLevel, zOffset: r1.result?.zOffset },
    fromRoot: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    fromInstance: { ok: r3.result !== null, maxLevel: r3.maxLevel, zOffset: r3.result?.zOffset },
  }, 'sub-assembly')

  return { rootAsm }
}
