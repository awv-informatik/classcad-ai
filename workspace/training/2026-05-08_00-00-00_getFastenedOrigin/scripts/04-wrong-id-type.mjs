export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Plate' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'Mate', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_Test',
    mate1: { path: [inst], csys: wcs },
  })).result

  // Try with instance ID
  const r1 = await api.v1.assembly.getFastenedOrigin({ id: inst, name: 'FO_Test' })
  console.log('[04] instance ID — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] instance ID — messages:', JSON.stringify(r1.messages))

  // Try with template ID
  const r2 = await api.v1.assembly.getFastenedOrigin({ id: tpl, name: 'FO_Test' })
  console.log('[04] template ID — result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[04] template ID — messages:', JSON.stringify(r2.messages))

  // Try with constraint ID itself
  const r3 = await api.v1.assembly.getFastenedOrigin({ id: foId, name: 'FO_Test' })
  console.log('[04] constraint ID — result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[04] constraint ID — messages:', JSON.stringify(r3.messages))

  filewrite({
    instanceId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    templateId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    constraintId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'wrong-id-types')

  return {}
}
