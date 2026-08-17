export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_NotFound' })).result

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

  // Create one constraint
  await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_Real',
    mate1: { path: [inst], csys: wcs },
  })

  // Try to get nonexistent name
  const r = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'DOES_NOT_EXIST' })
  console.log('[06] nonexistent name result:', r.result)
  console.log('[06] maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'not-found')

  return { asmId }
}
