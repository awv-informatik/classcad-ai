export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  const tplA = (await api.v1.assembly.partTemplate({ name: 'Base' })).result
  await api.v1.part.box({ id: tplA, name: 'Box', length: 60, width: 40, height: 10 })
  const wcsA = (await api.v1.part.workCSys({ id: tplA, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplB = (await api.v1.assembly.partTemplate({ name: 'Arm' })).result
  await api.v1.part.box({ id: tplB, name: 'Box', length: 80, width: 20, height: 8 })
  const wcsB = (await api.v1.part.workCSys({ id: tplB, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  const tplC = (await api.v1.assembly.partTemplate({ name: 'Link' })).result
  await api.v1.part.box({ id: tplC, name: 'Box', length: 40, width: 15, height: 6 })
  const wcsC = (await api.v1.part.workCSys({ id: tplC, name: 'Csys', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0] })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tplA, ownerId: asmId, name: 'Base' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tplB, ownerId: asmId, name: 'Arm' })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tplC, ownerId: asmId, name: 'Link' })).result

  await api.v1.assembly.fastenedOrigin({ id: asmId, name: 'Ground', mate1: { path: [inst1], csys: wcsA } })

  // Create two revolute constraints with the SAME name
  const rev1Id = (await api.v1.assembly.revolute({
    id: asmId, name: 'SameName',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst2], csys: wcsB },
    zOffset: 10,
  })).result

  const rev2Id = (await api.v1.assembly.revolute({
    id: asmId, name: 'SameName',
    mate1: { path: [inst1], csys: wcsA },
    mate2: { path: [inst3], csys: wcsC },
    zOffset: 20,
  })).result

  console.log('[06] rev1 id:', rev1Id, 'rev2 id:', rev2Id)

  // Query the duplicate name
  const r = await api.v1.assembly.getRevolute({ id: asmId, name: 'SameName' })
  console.log('[06] getRevolute result.id:', r.result?.id)
  console.log('[06] getRevolute result.zOffset:', r.result?.zOffset)
  console.log('[06] returned rev1?', r.result?.id === rev1Id)
  console.log('[06] returned rev2?', r.result?.id === rev2Id)

  filewrite({
    rev1Id, rev2Id,
    returned: r.result,
  }, 'duplicate-names')

  return { rev1Id, rev2Id }
}
