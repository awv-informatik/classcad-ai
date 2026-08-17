// Test: update references on XYAXISORIGIN CSys
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }, { pos: [80, 60, 40] }],
    lines: [{ pos: [40, 0, 0] }, { pos: [0, 0, 20] }]
  })
  const pt1 = gids.result?.points?.[0]
  const pt2 = gids.result?.points?.[1]
  const e1 = gids.result?.lines?.[0]
  const e2 = gids.result?.lines?.[1]

  if (!pt1 || !pt2 || !e1 || !e2) {
    console.log('[07] SKIP — missing refs')
    return { partId }
  }

  // Create XYAXISORIGIN with pt1
  const csId = (await api.v1.part.workCSys({
    id: partId, name: 'CS_ref', type: 'XYAXISORIGIN', references: [pt1, e1, e2]
  })).result
  console.log('[07] created:', csId)

  // Update to use pt2 as origin
  await api.v1.part.openFeature({ id: csId })
  const r = await api.v1.part.updateWorkCSys({ id: csId, references: [pt2, e1, e2] })
  console.log('[07] update refs:', r.result, r.maxLevel)
  console.log('[07] messages:', JSON.stringify(r.messages))
  await api.v1.part.closeFeature({ id: csId })

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'update-refs')
  return { partId }
}
