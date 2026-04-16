// Test OFB version option
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OFBVersion' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Default version (-2 = most current released)
  const vDefault = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  console.log('[18] OFB default version length:', vDefault.result.content?.length)

  // Explicitly -2
  const vMinus2 = await api.v1.common.save({ format: 'OFB', ofb: { version: -2 }, encoding: 'base64' })
  console.log('[18] OFB version=-2 length:', vMinus2.result.content?.length)

  // Try version -1
  const vMinus1 = await api.v1.common.save({ format: 'OFB', ofb: { version: -1 }, encoding: 'base64' })
  console.log('[18] OFB version=-1 success:', vMinus1.result.success, 'length:', vMinus1.result.content?.length)

  // Try version 0
  const v0 = await api.v1.common.save({ format: 'OFB', ofb: { version: 0 }, encoding: 'base64' })
  console.log('[18] OFB version=0 success:', v0.result.success, 'length:', v0.result.content?.length)

  // Check file header differences
  const rawDefault = await api.v1.common.save({ format: 'OFB' })
  const header = rawDefault.result.content.substring(0, 300)
  console.log('[18] OFB raw header:\n', header)

  filewrite({
    defaultLen: vDefault.result.content?.length,
    v_minus2: vMinus2.result.content?.length,
    v_minus1: { success: vMinus1.result.success, length: vMinus1.result.content?.length },
    v0: { success: v0.result.success, length: v0.result.content?.length },
    header,
  }, 'ofb-version')

  return { partId }
}
