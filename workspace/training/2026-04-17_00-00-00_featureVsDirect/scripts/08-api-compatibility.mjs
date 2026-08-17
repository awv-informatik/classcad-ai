export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ApiCompat' })).result

  // Feature box
  const featBoxId = (await api.v1.part.box({
    id: partId, name: 'FeatBox', length: 80, width: 60, height: 40,
  })).result

  // EIF + solid box
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const solidBoxId = (await api.v1.solid.box({
    id: eifId, length: 50, width: 50, height: 50,
    translation: [120, 0, 0],
  })).result

  // Test setAppearance on both
  const appFeatR = await api.v1.part.setAppearance({
    id: featBoxId,
    color: [255, 0, 0],
    transparency: 0.3,
  })
  console.log('[08] setAppearance on feat box:', appFeatR.result, 'maxLevel:', appFeatR.maxLevel)

  const appSolidR = await api.v1.part.setAppearance({
    id: solidBoxId,
    color: [0, 0, 255],
    transparency: 0.3,
  })
  console.log('[08] setAppearance on solid box:', appSolidR.result, 'maxLevel:', appSolidR.maxLevel)

  // Test calculateMassProperties on both
  const massFeatR = await api.v1.part.calculateMassProperties({ id: featBoxId })
  console.log('[08] mass feat box:', massFeatR.result ? 'ok' : 'null', 'maxLevel:', massFeatR.maxLevel)
  filewrite({ result: massFeatR.result, messages: massFeatR.messages, maxLevel: massFeatR.maxLevel }, 'mass-feat-result')

  const massSolidR = await api.v1.part.calculateMassProperties({ id: solidBoxId })
  console.log('[08] mass solid box:', massSolidR.result ? 'ok' : 'null', 'maxLevel:', massSolidR.maxLevel)
  filewrite({ result: massSolidR.result, messages: massSolidR.messages, maxLevel: massSolidR.maxLevel }, 'mass-solid-result')

  // Test setObjectName on both
  const nameFeatR = await api.v1.common.setObjectName({ id: featBoxId, name: 'RenamedFeat' })
  console.log('[08] setObjectName feat:', nameFeatR.result, 'maxLevel:', nameFeatR.maxLevel)

  const nameSolidR = await api.v1.common.setObjectName({ id: solidBoxId, name: 'RenamedSolid' })
  console.log('[08] setObjectName solid:', nameSolidR.result, 'maxLevel:', nameSolidR.maxLevel)

  // Test getGeometryIds on both
  const geoFeatR = await api.v1.part.getGeometryIds({ id: featBoxId })
  console.log('[08] getGeometryIds feat:', geoFeatR.result ? 'has data' : 'null', 'maxLevel:', geoFeatR.maxLevel)
  filewrite({ result: geoFeatR.result, messages: geoFeatR.messages, maxLevel: geoFeatR.maxLevel }, 'geo-feat-result')

  const geoSolidR = await api.v1.part.getGeometryIds({ id: solidBoxId })
  console.log('[08] getGeometryIds solid:', geoSolidR.result ? 'has data' : 'null', 'maxLevel:', geoSolidR.maxLevel)
  filewrite({ result: geoSolidR.result, messages: geoSolidR.messages, maxLevel: geoSolidR.maxLevel }, 'geo-solid-result')

  await snapshot('api-compat')

  return { partId, featBoxId, solidBoxId }
}
