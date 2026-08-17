export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'GFO_Missing' })).result

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

  await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO1',
    mate1: { path: [inst], csys: wcs },
  })

  // Missing name
  const r1 = await api.v1.assembly.getFastenedOrigin({ id: asmId })
  console.log('[14] no name - result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[14] no name - messages:', JSON.stringify(r1.messages))

  // Missing id
  const r2 = await api.v1.assembly.getFastenedOrigin({ name: 'FO1' })
  console.log('[14] no id - result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[14] no id - messages:', JSON.stringify(r2.messages))

  // Empty object
  const r3 = await api.v1.assembly.getFastenedOrigin({})
  console.log('[14] empty - result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    noName: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    noId: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    empty: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'missing-params')

  return { asmId }
}
