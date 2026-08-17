export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MirrorIdx' })).result

  // Create two boxes — the boolean will produce one feature with two solids
  const wcs1 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [20, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const box1 = (await api.v1.part.box({
    id: partId, name: 'Box1', length: 30, width: 25, height: 40, references: [wcs1],
  })).result

  const wcs2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS2',
    origin: [20, 40, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const box2 = (await api.v1.part.box({
    id: partId, name: 'Box2', length: 20, width: 20, height: 60, references: [wcs2],
  })).result
  console.log('[06] box1:', box1, 'box2:', box2)

  const rightWp = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Right' })).result

  await snapshot('before-indices')

  // Mirror only box1 using object format with id (no indices)
  const r1 = await api.v1.part.mirror({
    id: partId, name: 'MirrorObj',
    targets: [{ id: box1 }],
    references: [rightWp],
  })
  console.log('[06] mirror with object targets:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[06] messages:', JSON.stringify(r1.messages))

  await snapshot('mirror-obj-format')

  return { partId, box1, box2, mirrorId: r1.result }
}
