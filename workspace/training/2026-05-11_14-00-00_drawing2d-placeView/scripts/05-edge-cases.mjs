export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EdgeCases' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })

  // Test 1: empty placements array
  const r1 = await api.v1.drawing2d.placeView({
    id: partId,
    placements: [],
  })
  console.log('[05] empty placements result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[05] empty placements messages:', JSON.stringify(r1.messages))

  // Test 2: Z component in offset (views are XY-plane)
  const bboxBefore = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })).result
  console.log('[05] bbox before Z-offset:', JSON.stringify(bboxBefore))

  const r2 = await api.v1.drawing2d.placeView({
    id: partId,
    placements: [{ type: 'TOP', offset: [0, 0, 999] }],
  })
  console.log('[05] Z-offset result:', r2.result, 'maxLevel:', r2.maxLevel)

  const bboxAfter = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP'] })).result
  console.log('[05] bbox after Z-offset:', JSON.stringify(bboxAfter))

  // Test 3: duplicate type in one call
  const r3 = await api.v1.drawing2d.placeView({
    id: partId,
    placements: [
      { type: 'FRONT', offset: [10, 0, 0] },
      { type: 'FRONT', offset: [20, 0, 0] },
    ],
  })
  console.log('[05] duplicate type result:', r3.result, 'maxLevel:', r3.maxLevel)

  const bboxFront = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['FRONT'] })).result
  console.log('[05] FRONT bbox after double-place:', JSON.stringify(bboxFront))

  // Test 4: no views created
  const partId2 = (await api.v1.part.create({ name: 'NoViews' })).result
  await api.v1.part.box({ id: partId2, name: 'Box2', length: 50, width: 50, height: 50 })
  const r4 = await api.v1.drawing2d.placeView({
    id: partId2,
    placements: [{ type: 'TOP', offset: [100, 0, 0] }],
  })
  console.log('[05] no views result:', r4.result, 'maxLevel:', r4.maxLevel)
  console.log('[05] no views messages:', JSON.stringify(r4.messages))

  filewrite({
    emptyPlacements: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    zOffset: { bboxBefore, bboxAfter, result: r2.result, maxLevel: r2.maxLevel },
    duplicateType: { result: r3.result, maxLevel: r3.maxLevel, frontBbox: bboxFront },
    noViews: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages },
  }, 'edge-cases-data')

  return { partId }
}
