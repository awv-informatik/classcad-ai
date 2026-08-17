// 10 — Error cases: invalid references, wrong params
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // A) Missing required param `id`
  try {
    const r1 = await api.v1.part.workPlane({})
    console.log('[10] no id — result:', r1.result, 'maxLevel:', r1.maxLevel)
    if (r1.messages?.length) console.log('[10] msgs:', r1.messages[0]?.message)
  } catch (e) {
    console.log('[10] no id — error:', e.message)
  }

  // B) Invalid type string
  const r2 = await api.v1.part.workPlane({ id: partId, type: 'INVALID_TYPE' })
  console.log('[10] invalid type — result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[10] msgs:', r2.messages[0]?.message)

  // C) PLANE type with no references
  const r3 = await api.v1.part.workPlane({ id: partId, type: 'PLANE' })
  console.log('[10] PLANE no refs — result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[10] msgs:', r3.messages[0]?.message)

  // D) 3POINTS with only 2 points
  const wpt1 = (await api.v1.part.workPoint({ id: partId, name: 'P1', position: [0, 0, 0] })).result
  const wpt2 = (await api.v1.part.workPoint({ id: partId, name: 'P2', position: [100, 0, 0] })).result
  const r4 = await api.v1.part.workPlane({ id: partId, type: '3POINTS', references: [wpt1, wpt2] })
  console.log('[10] 3POINTS 2 refs — result:', r4.result, 'maxLevel:', r4.maxLevel)
  if (r4.messages?.length) console.log('[10] msgs:', r4.messages[0]?.message)

  // E) 3POINTS with collinear points
  const wpt3 = (await api.v1.part.workPoint({ id: partId, name: 'P3', position: [50, 0, 0] })).result
  const r5 = await api.v1.part.workPlane({ id: partId, type: '3POINTS', references: [wpt1, wpt2, wpt3] })
  console.log('[10] 3POINTS collinear — result:', r5.result, 'maxLevel:', r5.maxLevel)
  if (r5.messages?.length) console.log('[10] msgs:', r5.messages[0]?.message)

  // F) LINEPLANEANGLE with wrong reference types (two faces instead of line+plane)
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    planes: [
      { positions: [[40, 30, 40]] },
      { positions: [[40, 30, 0]] },
    ]
  })
  const f1 = gids.result?.planes?.[0]
  const f2 = gids.result?.planes?.[1]
  if (f1 && f2) {
    const r6 = await api.v1.part.workPlane({ id: partId, type: 'LINEPLANEANGLE', references: [f1, f2] })
    console.log('[10] LPA 2 faces — result:', r6.result, 'maxLevel:', r6.maxLevel)
    if (r6.messages?.length) console.log('[10] msgs:', r6.messages[0]?.message)
  }

  return { partId }
}
