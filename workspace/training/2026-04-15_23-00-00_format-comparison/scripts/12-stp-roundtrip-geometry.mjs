// STP roundtrip: does geometry survive? Compare vertex counts before/after
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StpGeoRT' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 20, translation: [40, 30, -10] })).result
  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cylId] })

  await snapshot('before-stp')

  // Capture graphic data before
  const saveBefore = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const graphicBefore = (await api.v1.common.save({ format: 'STL', encoding: 'base64' })).result
  console.log('[12] Before STP — STL size:', graphicBefore.content?.length)

  // Save as STP, roundtrip
  const stpData = (await api.v1.common.save({ format: 'STP', encoding: 'base64' })).result.content
  await api.v1.common.clear({})
  await api.v1.common.load({ data: stpData, format: 'STP', encoding: 'base64' })

  await snapshot('after-stp-roundtrip')

  // Capture graphic data after
  const graphicAfter = (await api.v1.common.save({ format: 'STL', encoding: 'base64' })).result
  console.log('[12] After STP — STL size:', graphicAfter.content?.length)

  // Compare: if STL sizes are very close, geometry was preserved
  const sizeBefore = graphicBefore.content?.length || 0
  const sizeAfter = graphicAfter.content?.length || 0
  const ratio = sizeAfter / sizeBefore
  console.log('[12] STL size ratio (after/before):', ratio.toFixed(3))

  filewrite({
    stlSizeBefore: sizeBefore,
    stlSizeAfter: sizeAfter,
    ratio: ratio,
    geometryPreserved: ratio > 0.9 && ratio < 1.1,
  }, 'stp-geometry-compare')

  return { partId }
}
