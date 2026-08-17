export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'FO_Get' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'Box', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'I1' })).result

  // Create with specific params
  const foId = (await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FO_Detailed',
    mate1: { path: [inst], csys: wcs, flip: '-X', reorient: '90' },
    xOffset: 25,
    yOffset: 15,
    zOffset: 10,
    xRotation: 0.5,
    zRotation: '30deg',
  })).result

  console.log('[09] created foId:', foId)

  // Read it back
  const get = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'FO_Detailed' })
  console.log('[09] getFastenedOrigin maxLevel:', get.maxLevel)
  filewrite(get.result, 'get-result')

  // Try getting with instance ID instead of assembly ID
  const get2 = await api.v1.assembly.getFastenedOrigin({ id: inst, name: 'FO_Detailed' })
  console.log('[09] get via instance id maxLevel:', get2.maxLevel)
  filewrite(get2.result, 'get-via-instance')

  // Try getting a nonexistent name
  const get3 = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'NoSuchConstraint' })
  console.log('[09] get nonexistent maxLevel:', get3.maxLevel, 'result:', get3.result)
  filewrite({ result: get3.result, messages: get3.messages, maxLevel: get3.maxLevel }, 'get-nonexistent')

  await snapshot('get-test')

  return { asmId }
}
