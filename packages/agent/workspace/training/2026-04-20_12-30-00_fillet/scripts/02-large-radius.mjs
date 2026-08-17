export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FilletLarge' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result

  await api.v1.common.recalc({})

  // Capture pre-fillet graphic data for vertex count comparison
  const beforeVis = await api.v1.common.requestVisualisation({})
  const beforeVertCount = beforeVis.graphic?.meshes?.[0]?.positions?.length / 3 || 0
  console.log('[02] before vertex count:', beforeVertCount)

  await snapshot('before')

  // Find top-front edge
  const geoIds = (await api.v1.part.getGeometryIds({ id: partId, lines: [{ pos: [40, 0, 40] }] })).result
  console.log('[02] edge IDs:', JSON.stringify(geoIds.lines))

  // Large radius = 15
  const r = await api.v1.part.fillet({
    id: partId,
    name: 'BigFillet',
    references: geoIds.lines,
    radius: 15,
  })
  console.log('[02] fillet result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'fillet-response')

  // Capture post-fillet graphic data
  const afterVis = await api.v1.common.requestVisualisation({})
  const afterVertCount = afterVis.graphic?.meshes?.[0]?.positions?.length / 3 || 0
  console.log('[02] after vertex count:', afterVertCount)

  filewrite({ beforeVertCount, afterVertCount, delta: afterVertCount - beforeVertCount }, 'vertex-comparison')

  await snapshot('after')

  return { partId, boxId, filletId: r.result }
}
