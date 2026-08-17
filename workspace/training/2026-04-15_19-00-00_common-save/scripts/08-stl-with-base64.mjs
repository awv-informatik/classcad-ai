// STL binary data needs base64 encoding for safe string transport
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'STLb64' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // STL binary + base64
  const stlBinB64 = await api.v1.common.save({ format: 'STL', encoding: 'base64' })
  console.log('[08] STL binary+b64 success:', stlBinB64.result.success)
  console.log('[08] STL binary+b64 length:', stlBinB64.result.content?.length)
  console.log('[08] STL binary+b64 first 100:', stlBinB64.result.content?.substring(0, 100))

  // STL ASCII + base64
  const stlAsciiB64 = await api.v1.common.save({ format: 'STL', stl: { binary: 0 }, encoding: 'base64' })
  console.log('[08] STL ascii+b64 success:', stlAsciiB64.result.success)
  console.log('[08] STL ascii+b64 length:', stlAsciiB64.result.content?.length)

  // STL with deflate+base64
  const stlFull = await api.v1.common.save({ format: 'STL', encoding: 'base64', compression: 'deflate' })
  console.log('[08] STL deflate+b64 success:', stlFull.result.success)
  console.log('[08] STL deflate+b64 length:', stlFull.result.content?.length)

  // STL fine faceting + base64
  const stlFine = await api.v1.common.save({ format: 'STL', stl: { facetingTol: 0.01, angleTol: 2, binary: 0 }, encoding: 'base64' })
  console.log('[08] STL fine+b64 success:', stlFine.result.success)
  console.log('[08] STL fine+b64 length:', stlFine.result.content?.length)

  filewrite({
    binaryB64: { success: stlBinB64.result.success, length: stlBinB64.result.content?.length },
    asciiB64: { success: stlAsciiB64.result.success, length: stlAsciiB64.result.content?.length },
    deflateB64: { success: stlFull.result.success, length: stlFull.result.content?.length },
    fineB64: { success: stlFine.result.success, length: stlFine.result.content?.length },
  }, 'stl-b64')

  return { partId }
}
