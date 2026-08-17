export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CenterTest' })).result
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })
  await api.v1.drawing2d.view({ id: partId, types: ['TOP', 'FRONT'] })

  // Bbox BEFORE centering
  const before = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT'] })).result
  console.log('[06] BEFORE center TOP:', JSON.stringify(before[0]))
  console.log('[06] BEFORE center FRONT:', JSON.stringify(before[1]))

  // Center views
  await api.v1.drawing2d.centerView({ id: partId })

  // Bbox AFTER centering
  const after = (await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: ['TOP', 'FRONT'] })).result
  console.log('[06] AFTER center TOP:', JSON.stringify(after[0]))
  console.log('[06] AFTER center FRONT:', JSON.stringify(after[1]))

  // Verify: center should be at origin, dimensions unchanged
  const topWidthBefore = before[0].max.x - before[0].min.x
  const topWidthAfter = after[0].max.x - after[0].min.x
  const topCenterAfterX = (after[0].max.x + after[0].min.x) / 2
  const topCenterAfterY = (after[0].max.y + after[0].min.y) / 2
  console.log('[06] TOP width before:', topWidthBefore, 'after:', topWidthAfter)
  console.log('[06] TOP center after:', topCenterAfterX, topCenterAfterY)

  filewrite({ before, after }, 'center-comparison')

  return { partId }
}
