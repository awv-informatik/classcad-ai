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

  await api.v1.assembly.revolute({
    id: asmId, name: 'Hinge1',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
  })

  // Query non-existent name
  const r1 = await api.v1.assembly.getRevolute({ id: asmId, name: 'DoesNotExist' })
  console.log('[02] non-existent result:', r1.result)
  console.log('[02] non-existent maxLevel:', r1.maxLevel)
  console.log('[02] non-existent messages:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'nonexistent')

  // Query empty name
  const r2 = await api.v1.assembly.getRevolute({ id: asmId, name: '' })
  console.log('[02] empty name result:', r2.result)
  console.log('[02] empty name maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'empty-name')

  // Query wrong constraint type name (e.g., a fastenedOrigin name)
  const r3 = await api.v1.assembly.getRevolute({ id: asmId, name: 'Ground' })
  console.log('[02] wrong type result:', r3.result)
  console.log('[02] wrong type maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'wrong-type')

  return { asmId }
}
