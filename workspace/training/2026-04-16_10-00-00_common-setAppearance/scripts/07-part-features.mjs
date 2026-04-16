// Test setAppearance on part-level features (part.box, part.extrusion, etc.)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PartFeatureTest' })).result
  const boxFeat = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  console.log('[07] partId:', partId, 'boxFeat:', boxFeat)

  await snapshot('before')

  // Set color on part.box feature
  const r1 = await api.v1.common.setAppearance({ target: boxFeat, color: [255, 0, 0] })
  console.log('[07] part.box feature result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'partbox-response')

  await snapshot('after-red-box')

  // Create another feature and color differently
  const skId = (await api.v1.part.sketch({ id: partId, name: 'Sk1' })).result
  const circId = (await api.v1.sketch.circle({ id: skId, centerPos: [30, 20, 0], radius: 8 })).result
  const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: [circId] })).result
  const extFeat = (await api.v1.part.extrusion({
    id: partId, name: 'Ext1', references: [regionId], type: 'UP', limit2: 35,
  })).result
  console.log('[07] extFeat:', extFeat)

  const r2 = await api.v1.common.setAppearance({ target: extFeat, color: [0, 255, 0] })
  console.log('[07] extrusion feature result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('after-green-ext')

  // Test: try setting appearance on the sketch feature itself
  const r3 = await api.v1.common.setAppearance({ target: skId, color: [0, 0, 255] })
  console.log('[07] sketch feature result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, messages: r3.messages, maxLevel: r3.maxLevel }, 'sketch-feature')

  return { partId, boxFeat, extFeat }
}
