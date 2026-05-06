export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl = (await api.v1.assembly.partTemplate({ name: 'Block' })).result
  await api.v1.part.box({ id: tpl, name: 'B', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'M', origin: [0, 0, 0],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const inst = (await api.v1.assembly.instance({
    productId: tpl, ownerId: asmId, name: 'I1',
  })).result

  // Create with various params to verify getFastenedOrigin returns them
  const foR = await api.v1.assembly.fastenedOrigin({
    id: asmId, name: 'TestFO',
    mate1: { path: [inst], csys: wcs, flip: '-Z', reorient: '90' },
    xOffset: 10, yOffset: 20, zOffset: 30,
    xRotation: '45deg', yRotation: 0.5, zRotation: '90deg',
  })
  console.log('[08] created:', foR.result, 'maxLevel:', foR.maxLevel)

  // Get it back
  const state = (await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'TestFO' })).result
  console.log('[08] getFastenedOrigin:', JSON.stringify(state))
  filewrite(state, 'get-fo-state')

  // Test: nonexistent name
  const bad = await api.v1.assembly.getFastenedOrigin({ id: asmId, name: 'NoSuchFO' })
  console.log('[08] nonexistent name:', bad.result, 'maxLevel:', bad.maxLevel)
  filewrite({ result: bad.result, messages: bad.messages, maxLevel: bad.maxLevel }, 'get-fo-bad-name')

  // Test: instance ID instead of assembly root
  const instQ = await api.v1.assembly.getFastenedOrigin({ id: inst, name: 'TestFO' })
  console.log('[08] instance id:', instQ.result, 'maxLevel:', instQ.maxLevel)
  filewrite({ result: instQ.result, messages: instQ.messages, maxLevel: instQ.maxLevel }, 'get-fo-instance-id')

  return {}
}
