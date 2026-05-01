export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_WrongId' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'Inst1',
  })).result

  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO1',
    mate1: { path: [inst], csys: wcs },
  })).result

  // Try with instance ID
  const r1 = await api.v1.assembly.getFastenedOrigin({ id: inst, name: 'FO1' })
  console.log('[07] instance ID result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[07] instance ID messages:', JSON.stringify(r1.messages))

  // Try with constraint ID
  const r2 = await api.v1.assembly.getFastenedOrigin({ id: foId, name: 'FO1' })
  console.log('[07] constraint ID result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[07] constraint ID messages:', JSON.stringify(r2.messages))

  // Try with template ID
  const r3 = await api.v1.assembly.getFastenedOrigin({ id: tpl, name: 'FO1' })
  console.log('[07] template ID result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[07] template ID messages:', JSON.stringify(r3.messages))

  filewrite({
    instanceId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    constraintId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    templateId: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'wrong-id-types')

  return { asmId }
}
