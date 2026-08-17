export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Dup' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 30, width: 20, height: 15 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'I1' })).result

  // Create first fastenedOrigin
  const fo1 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_first', mate1: { path: [inst], csys: wcs },
  })
  console.log('[12] first fastenedOrigin:', fo1.result, 'maxLevel:', fo1.maxLevel)

  // Try creating a SECOND fastenedOrigin on the SAME instance
  const fo2 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_second', mate1: { path: [inst], csys: wcs }, xOffset: 50,
  })
  console.log('[12] second fastenedOrigin (same inst):', fo2.result, 'maxLevel:', fo2.maxLevel)
  if (fo2.messages?.length) {
    console.log('[12] messages:', fo2.messages.map(m => m.message).join('; '))
  }

  filewrite({
    first: { result: fo1.result, maxLevel: fo1.maxLevel, messages: fo1.messages },
    second: { result: fo2.result, maxLevel: fo2.maxLevel, messages: fo2.messages },
  }, 'duplicate-results')

  // Try duplicate constraint names
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'I2' })).result
  const fo3 = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'FO_first', mate1: { path: [inst2], csys: wcs }, yOffset: 40,
  })
  console.log('[12] duplicate name:', fo3.result, 'maxLevel:', fo3.maxLevel)
  filewrite({ dupName: { result: fo3.result, maxLevel: fo3.maxLevel } }, 'dup-name-result')

  await snapshot('duplicates')

  return { asmId }
}
