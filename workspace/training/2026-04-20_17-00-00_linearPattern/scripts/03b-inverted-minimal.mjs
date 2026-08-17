export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvertedMinimal' })).result
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 25,
  })).result
  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // Test 1: inverted as numeric 1 (ClassCAD TRUE)
  const r1 = await api.v1.part.linearPattern({
    id: partId, name: 'LP_inv1',
    targets: [boxId],
    dir1: { references: [waId], distance: 40, count: 3, inverted: 1 },
  })
  console.log('[03b] inverted=1:', r1.result, 'maxLevel:', r1.maxLevel, 'msgs:', JSON.stringify(r1.messages))

  // Test 2: inverted as FALSE (should work same as omitting it)
  const partId2 = (await api.v1.part.create({ name: 'InvertedFalse' })).result
  const boxId2 = (await api.v1.part.box({
    id: partId2, name: 'Box2',
    length: 20, width: 15, height: 25,
  })).result
  const waId2 = (await api.v1.part.workAxis({
    id: partId2, name: 'Axis2',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  const r2 = await api.v1.part.linearPattern({
    id: partId2, name: 'LP_inv0',
    targets: [boxId2],
    dir1: { references: [waId2], distance: 40, count: 3, inverted: 0 },
  })
  console.log('[03b] inverted=0:', r2.result, 'maxLevel:', r2.maxLevel, 'msgs:', JSON.stringify(r2.messages))

  // Test 3: reversed axis direction as alternative to inverted
  const partId3 = (await api.v1.part.create({ name: 'ReversedAxis' })).result
  const wcs3 = (await api.v1.part.workCSys({
    id: partId3, name: 'WCS3',
    origin: [80, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const boxId3 = (await api.v1.part.box({
    id: partId3, name: 'Box3',
    length: 20, width: 15, height: 25,
    references: [wcs3],
  })).result
  // Axis pointing in -X direction
  const waId3 = (await api.v1.part.workAxis({
    id: partId3, name: 'Axis3',
    origin: [0, 0, 0], direction: [-1, 0, 0],
  })).result

  const r3 = await api.v1.part.linearPattern({
    id: partId3, name: 'LP_reversed',
    targets: [boxId3],
    dir1: { references: [waId3], distance: 40, count: 3 },
  })
  console.log('[03b] reversed axis:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'reversed-axis-response')
  await snapshot('reversed-axis')

  return { partId }
}
