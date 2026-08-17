// 06 — Update angle on LINEPLANEANGLE, and multiple updates in one open session
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const gids = await api.v1.part.getGeometryIds({
    id: partId,
    lines: [{ pos: [40, 0, 0] }],
    planes: [{ positions: [[40, 30, 0]] }]
  })
  const edge = gids.result?.lines?.[0]
  const face = gids.result?.planes?.[0]

  // Create LPA at 0 degrees
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'WP_lpa',
    type: 'LINEPLANEANGLE', references: [edge, face], angle: 0
  })).result
  console.log('[06] created LPA wpId:', wpId)

  await snapshot('lpa-0deg')

  // Update angle to 45deg
  await api.v1.part.openFeature({ id: wpId })
  const r1 = await api.v1.part.updateWorkPlane({ id: wpId, angle: '45deg' })
  console.log('[06] angle→45deg:', r1.result, 'maxLevel:', r1.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('lpa-45deg')

  // Multiple updates in one open session
  await api.v1.part.openFeature({ id: wpId })
  const r2 = await api.v1.part.updateWorkPlane({ id: wpId, angle: '60deg' })
  console.log('[06] angle→60deg:', r2.result, 'maxLevel:', r2.maxLevel)
  const r3 = await api.v1.part.updateWorkPlane({ id: wpId, angle: '90deg' })
  console.log('[06] angle→90deg:', r3.result, 'maxLevel:', r3.maxLevel)
  await api.v1.part.closeFeature({ id: wpId })

  await snapshot('lpa-90deg')
  return { partId, wpId }
}
