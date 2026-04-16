// Compare all working formats with same geometry, all base64 encoded for fair comparison
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SizeCompare' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  const ofb = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const ofbDeflate = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const scg = await api.v1.common.save({ format: 'SCG', encoding: 'base64' })
  const stp = await api.v1.common.save({ format: 'STP', encoding: 'base64' })
  const stl = await api.v1.common.save({ format: 'STL', encoding: 'base64' })
  const iwpAscii = await api.v1.common.save({ format: 'IWP', encoding: 'base64' })
  const iwpBin = await api.v1.common.save({ format: 'IWP', iwp: { binary: 1 }, encoding: 'base64' })

  const comparison = {
    'OFB (raw b64)': ofb.result.content?.length,
    'OFB (deflate+b64)': ofbDeflate.result.content?.length,
    'SCG (b64)': scg.result.content?.length,
    'STP (b64)': stp.result.content?.length,
    'STL (b64)': stl.result.content?.length,
    'IWP ASCII (b64)': iwpAscii.result.content?.length,
    'IWP Binary (b64)': iwpBin.result.content?.length,
  }

  for (const [fmt, len] of Object.entries(comparison)) {
    console.log(`[20] ${fmt}: ${len} chars`)
  }

  filewrite(comparison, 'format-sizes')

  return { partId }
}
