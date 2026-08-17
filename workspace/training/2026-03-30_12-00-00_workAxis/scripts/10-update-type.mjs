// Test: updateWorkAxis — change type (USERDEFINED → referenced → back)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    points: [{ pos: [0, 0, 0] }, { pos: [80, 60, 40] }],
    lines: [{ pos: [40, 0, 0] }]
  })
  const pt1 = gids.result?.points?.[0]
  const pt2 = gids.result?.points?.[1]
  const edge = gids.result?.lines?.[0]
  console.log('[10] pt1:', pt1, 'pt2:', pt2, 'edge:', edge)

  // Create as USERDEFINED
  const waId = (await api.v1.part.workAxis({
    id: partId,
    name: 'WA_morph',
    position: [0, 0, 0],
    direction: [1, 0, 0]
  })).result
  console.log('[10] created USERDEFINED:', waId)

  // Open, update to 2POINTS, close
  await api.v1.part.openFeature({ id: waId })
  if (pt1 && pt2) {
    const r1 = await api.v1.part.updateWorkAxis({ id: waId, type: '2POINTS', references: [pt1, pt2] })
    console.log('[10] → 2POINTS result:', r1.result, 'maxLevel:', r1.maxLevel)
    console.log('[10] messages:', JSON.stringify(r1.messages))
    filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'to-2points')
  }
  await api.v1.part.closeFeature({ id: waId })

  // Open, update back to USERDEFINED, close
  await api.v1.part.openFeature({ id: waId })
  const r2 = await api.v1.part.updateWorkAxis({
    id: waId,
    type: 'USERDEFINED',
    position: [50, 30, 20],
    direction: [0, 1, 0]
  })
  console.log('[10] → USERDEFINED result:', r2.result, 'maxLevel:', r2.maxLevel)
  console.log('[10] messages:', JSON.stringify(r2.messages))
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'back-to-userdefined')
  await api.v1.part.closeFeature({ id: waId })

  // Open, update to CURVE, close
  await api.v1.part.openFeature({ id: waId })
  if (edge) {
    const r3 = await api.v1.part.updateWorkAxis({ id: waId, type: 'CURVE', references: [edge] })
    console.log('[10] → CURVE result:', r3.result, 'maxLevel:', r3.maxLevel)
    console.log('[10] messages:', JSON.stringify(r3.messages))
    filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'to-curve')
  }
  await api.v1.part.closeFeature({ id: waId })

  await snapshot('type-morphing')
  return { partId }
}
