// Test: change type CUSTOM → XYAXISORIGIN → CUSTOM
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const csId = (await api.v1.part.workCSys({ id: partId, name: 'CS1' })).result

  // Get refs for XYAXISORIGIN
  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }],
    lines: [{ pos: [40, 0, 0] }, { pos: [0, 0, 20] }]
  })
  const pt = gids.result?.points?.[0]
  const e1 = gids.result?.lines?.[0]
  const e2 = gids.result?.lines?.[1]
  console.log('[04] refs:', pt, e1, e2)

  // CUSTOM → XYAXISORIGIN
  if (pt && e1 && e2) {
    await api.v1.part.openFeature({ id: csId })
    const r1 = await api.v1.part.updateWorkCSys({
      id: csId, type: 'XYAXISORIGIN', references: [pt, e1, e2]
    })
    console.log('[04] → XYAXISORIGIN:', r1.result, r1.maxLevel)
    console.log('[04] messages:', JSON.stringify(r1.messages))
    await api.v1.part.closeFeature({ id: csId })
    filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'to-xyaxis')

    // XYAXISORIGIN → CUSTOM
    await api.v1.part.openFeature({ id: csId })
    const r2 = await api.v1.part.updateWorkCSys({
      id: csId, type: 'CUSTOM', offset: [20, 20, 20]
    })
    console.log('[04] → CUSTOM:', r2.result, r2.maxLevel)
    await api.v1.part.closeFeature({ id: csId })
    filewrite({ result: r2.result, maxLevel: r2.maxLevel }, 'back-to-custom')
  }

  // Type change without refs
  await api.v1.part.openFeature({ id: csId })
  const r3 = await api.v1.part.updateWorkCSys({ id: csId, type: 'XYAXISORIGIN' })
  console.log('[04] XYAXISORIGIN no refs:', r3.result, r3.maxLevel)
  console.log('[04] messages:', JSON.stringify(r3.messages))
  await api.v1.part.closeFeature({ id: csId })
  filewrite({ result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'no-refs')

  return { partId }
}
