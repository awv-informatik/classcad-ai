export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'InvertedTest' })).result

  // Offset box from origin so we can see inversion direction
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [60, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 20, width: 15, height: 25,
    references: [wcs],
  })).result

  const waId = (await api.v1.part.workAxis({
    id: partId, name: 'Axis',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // Normal (not inverted) — pattern in +X
  const r1 = await api.v1.part.linearPattern({
    id: partId, name: 'LP_normal',
    targets: [boxId],
    dir1: { references: [waId], distance: 40, count: 3 },
  })
  console.log('[03] normal result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[03] normal msgs:', JSON.stringify(r1.messages))
  await snapshot('normal')

  // Now inverted — fresh part
  const partId2 = (await api.v1.part.create({ name: 'InvertedTest2' })).result
  const wcs2 = (await api.v1.part.workCSys({
    id: partId2, name: 'WCS2',
    origin: [60, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const boxId2 = (await api.v1.part.box({
    id: partId2, name: 'Box2',
    length: 20, width: 15, height: 25,
    references: [wcs2],
  })).result
  const waId2 = (await api.v1.part.workAxis({
    id: partId2, name: 'Axis2',
    origin: [0, 0, 0], direction: [1, 0, 0],
  })).result

  // Try with JS true
  const r2 = await api.v1.part.linearPattern({
    id: partId2, name: 'LP_inverted',
    targets: [boxId2],
    dir1: { references: [waId2], distance: 40, count: 3, inverted: true },
  })
  console.log('[03] inverted(true) result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[03] inverted(true) msgs:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'inverted-true-response')

  if (r2.maxLevel >= 51) {
    // Try with 'TRUE' string
    const partId3 = (await api.v1.part.create({ name: 'InvertedTest3' })).result
    const wcs3 = (await api.v1.part.workCSys({
      id: partId3, name: 'WCS3',
      origin: [60, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
    })).result
    const boxId3 = (await api.v1.part.box({
      id: partId3, name: 'Box3',
      length: 20, width: 15, height: 25,
      references: [wcs3],
    })).result
    const waId3 = (await api.v1.part.workAxis({
      id: partId3, name: 'Axis3',
      origin: [0, 0, 0], direction: [1, 0, 0],
    })).result

    const r3 = await api.v1.part.linearPattern({
      id: partId3, name: 'LP_inverted_str',
      targets: [boxId3],
      dir1: { references: [waId3], distance: 40, count: 3, inverted: 'TRUE' },
    })
    console.log('[03] inverted(TRUE) result:', r3.result, 'maxLevel:', r3.maxLevel)
    console.log('[03] inverted(TRUE) msgs:', JSON.stringify(r3.messages))
    filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'inverted-TRUE-response')
    await snapshot('inverted-TRUE')
  } else {
    await snapshot('inverted-true')
  }

  return { partId }
}
