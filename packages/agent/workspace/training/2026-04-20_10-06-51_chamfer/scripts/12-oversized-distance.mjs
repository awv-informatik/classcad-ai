export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OversizedChamfer' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // Find top-front edge (height=40, so max chamfer on each face is 40 or 60)
  const edgeIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines

  // Try distance1=50 — exceeds height (40) on at least one face
  const r1 = await api.v1.part.chamfer({
    id: partId,
    name: 'BigChamfer',
    references: edgeIds,
    distance1: 50,
  })
  console.log('[12] distance1=50 result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[12] messages:', JSON.stringify(r1.messages))

  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'big-chamfer')

  if (r1.result) await snapshot('dist-50')

  // Try distance1=100 — exceeds both adjacent face dimensions
  const partId2 = (await api.v1.part.create({ name: 'OversizedChamfer2' })).result
  const boxId2 = (await api.v1.part.box({ id: partId2, name: 'Box2', length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  const edgeIds2 = (await api.v1.part.getGeometryIds({
    id: partId2,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines

  const r2 = await api.v1.part.chamfer({
    id: partId2,
    name: 'HugeChamfer',
    references: edgeIds2,
    distance1: 100,
  })
  console.log('[12] distance1=100 result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[12] messages:', JSON.stringify(r2.messages))

  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'huge-chamfer')

  if (r2.result) await snapshot('dist-100')

  return { partId, partId2 }
}
