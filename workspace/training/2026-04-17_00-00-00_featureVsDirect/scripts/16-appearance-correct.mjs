export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AppearanceTest' })).result

  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'FeatBox', length: 80, width: 60, height: 40,
  })).result

  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidBoxId = (await api.v1.solid.box({
    id: eifId, length: 50, width: 50, height: 50,
    translation: [120, 0, 0],
  })).result

  // setAppearance with partId (should affect all bodies?)
  const appPartR = await api.v1.part.setAppearance({
    id: partId,
    color: [255, 0, 0],
    transparency: 0.3,
  })
  console.log('[16] setAppearance on partId:', appPartR.result, 'maxLevel:', appPartR.maxLevel)
  filewrite({ result: appPartR.result, messages: appPartR.messages, maxLevel: appPartR.maxLevel }, 'appearance-part-result')

  // getGeometryIds with partId
  const geoR = await api.v1.part.getGeometryIds({ id: partId })
  console.log('[16] getGeometryIds partId:', geoR.result ? 'has data' : 'null', 'maxLevel:', geoR.maxLevel)
  filewrite({ result: geoR.result, messages: geoR.messages, maxLevel: geoR.maxLevel }, 'geo-ids-part')

  // getGeometryPositions with partId
  const posR = await api.v1.part.getGeometryPositions({ id: partId })
  console.log('[16] getGeometryPositions partId:', posR.result ? 'has data' : 'null', 'maxLevel:', posR.maxLevel)
  filewrite({ result: posR.result, messages: posR.messages, maxLevel: posR.maxLevel }, 'geo-positions-part')

  await snapshot('appearance-test')

  return { partId, featBoxId, solidBoxId }
}
