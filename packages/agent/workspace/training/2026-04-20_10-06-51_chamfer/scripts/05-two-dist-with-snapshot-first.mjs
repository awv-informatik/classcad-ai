export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChamferTwoDistSnap' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  console.log('[05] partId:', partId, 'boxId:', boxId)

  // Call snapshot FIRST (like scripts 01/02 did) — this triggers visualization
  await snapshot('before')

  // Now find top-front edge — will this give a different ID?
  const edgeIds = (await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 40] }],
  })).result.lines
  console.log('[05] edge IDs (after snapshot):', JSON.stringify(edgeIds))

  // TWO_DISTANCES with these IDs
  const r = await api.v1.part.chamfer({
    id: partId,
    name: 'ChamferAsym',
    references: edgeIds,
    type: 'TWO_DISTANCES',
    distance1: 5,
    distance2: 20,
  })
  console.log('[05] TWO_DISTANCES result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages?.length) console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'chamfer-response')

  await snapshot('after')

  return { partId, chamferId: r.result }
}
