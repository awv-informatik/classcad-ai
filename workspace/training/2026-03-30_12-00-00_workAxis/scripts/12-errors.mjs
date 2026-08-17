// Test: error cases — missing id, wrong ref count, invalid type
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  // Missing id
  const r1 = await api.v1.part.workAxis({})
  console.log('[12] no id result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[12] no id msgs:', JSON.stringify(r1.messages))

  // Invalid type string
  const r2 = await api.v1.part.workAxis({ id: partId, type: 'INVALID' })
  console.log('[12] invalid type result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[12] invalid type msgs:', JSON.stringify(r2.messages))

  // Referenced type without references
  const r3 = await api.v1.part.workAxis({ id: partId, type: '2POINTS' })
  console.log('[12] 2POINTS no refs result:', r3.result, 'maxLevel:', r3.maxLevel)
  console.log('[12] 2POINTS no refs msgs:', JSON.stringify(r3.messages))

  // Wrong number of references for 2PLANES (only 1)
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [{ positions: [[40, 30, 40]] }]
  })
  const face = gids.result?.planes?.[0]
  if (face) {
    const r4 = await api.v1.part.workAxis({ id: partId, type: '2PLANES', references: [face] })
    console.log('[12] 2PLANES 1 ref result:', r4.result, 'maxLevel:', r4.maxLevel)
    console.log('[12] 2PLANES 1 ref msgs:', JSON.stringify(r4.messages))
  }

  // POINTDIRECTION with wrong ref types (two edges instead of point+edge)
  const gids2 = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }, { pos: [0, 0, 20] }]
  })
  const e1 = gids2.result?.lines?.[0]
  const e2 = gids2.result?.lines?.[1]
  if (e1 && e2) {
    const r5 = await api.v1.part.workAxis({ id: partId, type: 'POINTDIRECTION', references: [e1, e2] })
    console.log('[12] PTDIR 2 edges result:', r5.result, 'maxLevel:', r5.maxLevel)
    console.log('[12] PTDIR 2 edges msgs:', JSON.stringify(r5.messages))
  }

  filewrite({
    noId: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    invalidType: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages },
    noRefs: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
  }, 'error-responses')

  return { partId }
}
