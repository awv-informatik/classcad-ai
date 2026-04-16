// Test save as STL — binary vs ASCII, faceting options
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SaveSTL' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Default STL (binary=TRUE)
  const stlBin = await api.v1.common.save({ format: 'STL' })
  console.log('[06] STL binary success:', stlBin.result.success)
  console.log('[06] STL binary length:', stlBin.result.content?.length)
  console.log('[06] STL binary maxLevel:', stlBin.maxLevel)
  console.log('[06] STL binary content type:', typeof stlBin.result.content)

  // ASCII STL
  const stlAscii = await api.v1.common.save({ format: 'STL', stl: { binary: 0 } })
  console.log('[06] STL ASCII success:', stlAscii.result.success)
  console.log('[06] STL ASCII length:', stlAscii.result.content?.length)
  console.log('[06] STL ASCII first 200:', stlAscii.result.content?.substring(0, 200))

  // Custom faceting
  const stlFine = await api.v1.common.save({ format: 'STL', stl: { facetingTol: 0.01, angleTol: 2, binary: 0 } })
  console.log('[06] STL fine success:', stlFine.result.success)
  console.log('[06] STL fine length:', stlFine.result.content?.length)

  // Coarse faceting
  const stlCoarse = await api.v1.common.save({ format: 'STL', stl: { facetingTol: 1.0, angleTol: 30, binary: 0 } })
  console.log('[06] STL coarse success:', stlCoarse.result.success)
  console.log('[06] STL coarse length:', stlCoarse.result.content?.length)

  filewrite({
    binary: { success: stlBin.result.success, length: stlBin.result.content?.length },
    ascii: { success: stlAscii.result.success, length: stlAscii.result.content?.length },
    fine: { success: stlFine.result.success, length: stlFine.result.content?.length },
    coarse: { success: stlCoarse.result.success, length: stlCoarse.result.content?.length },
    asciiPreview: stlAscii.result.content?.substring(0, 500),
  }, 'stl-comparison')

  return { partId }
}
