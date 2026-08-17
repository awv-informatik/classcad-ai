export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PartFeatureTest' })).result

  // Create a box feature (part-level, not entity injection)
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  console.log('[12] box feature id:', boxId)

  // Set user data on part-level box feature
  const setR = await api.v1.common.setUserData({ id: boxId, key: 'feature-type', value: 'box' })
  console.log('[12] set on box feature: maxLevel=', setR.maxLevel)

  const getR = (await api.v1.common.getUserData({ id: boxId, key: 'feature-type' })).result
  console.log('[12] get from box feature:', JSON.stringify(getR))

  // Create a sketch and extrusion feature
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const circleId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 10 })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circleId] })).result
  const extId = (await api.v1.part.extrusion({ id: partId, name: 'Ext1', references: [regionId], type: 'UP', limit2: 35 })).result
  console.log('[12] extrusion feature id:', extId)

  await api.v1.common.setUserData({ id: extId, key: 'purpose', value: 'hole' })
  const extVal = (await api.v1.common.getUserData({ id: extId, key: 'purpose' })).result
  console.log('[12] get from extrusion feature:', JSON.stringify(extVal))

  // Work plane
  const wpId = (await api.v1.part.workPlane({ id: partId, name: 'WP1', origin: [0, 0, 50], normal: [0, 0, 1], xDirection: [1, 0, 0] })).result
  await api.v1.common.setUserData({ id: wpId, key: 'role', value: 'reference' })
  const wpVal = (await api.v1.common.getUserData({ id: wpId, key: 'role' })).result
  console.log('[12] get from work plane:', JSON.stringify(wpVal))

  filewrite({
    boxFeature: { id: boxId, value: getR },
    extrusion: { id: extId, value: extVal },
    workPlane: { id: wpId, value: wpVal },
  }, 'part-features')

  return { partId }
}
