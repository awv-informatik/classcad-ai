export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UpdateName' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const yAxisId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'YAxis' })).result

  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId })).result
  const rectIds = (await api.v1.sketch.rectangle({
    id: skId, startPos: [20, 0, 0], endPos: [40, 30, 0]
  })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result

  const revResult = await api.v1.part.revolve({
    id: partId, name: 'OriginalRev', references: [regionId], axisIds: [yAxisId],
    endAngle: Math.PI / 2
  })
  const revId = revResult.result
  console.log('[04] revolve created:', revId, 'name: OriginalRev')
  filewrite(revResult.structure, 'before-structure')

  // Rename via updateRevolve
  await api.v1.part.openFeature({ id: revId })
  const r = await api.v1.part.updateRevolve({ id: revId, name: 'RenamedRev' })
  console.log('[04] rename result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'rename-response')
  await api.v1.part.closeFeature({ id: revId })

  // Check structure after rename
  const check = await api.v1.common.getAppVersion({})
  filewrite(check.structure, 'after-structure')

  return { partId, revId }
}
