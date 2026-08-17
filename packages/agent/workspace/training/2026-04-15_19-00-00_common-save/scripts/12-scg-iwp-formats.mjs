// Test SCG and IWP formats
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'FormatTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // SCG format
  const scg = await api.v1.common.save({ format: 'SCG', encoding: 'base64' })
  console.log('[12] SCG success:', scg.result.success)
  console.log('[12] SCG length:', scg.result.content?.length)
  console.log('[12] SCG maxLevel:', scg.maxLevel)
  console.log('[12] SCG messages:', JSON.stringify(scg.messages))

  // IWP format (SMLib internal)
  const iwp = await api.v1.common.save({ format: 'IWP', encoding: 'base64' })
  console.log('[12] IWP success:', iwp.result.success)
  console.log('[12] IWP length:', iwp.result.content?.length)
  console.log('[12] IWP maxLevel:', iwp.maxLevel)

  // IWP binary mode
  const iwpBin = await api.v1.common.save({ format: 'IWP', iwp: { binary: 1 }, encoding: 'base64' })
  console.log('[12] IWP binary success:', iwpBin.result.success)
  console.log('[12] IWP binary length:', iwpBin.result.content?.length)

  filewrite({
    scg: { success: scg.result.success, length: scg.result.content?.length, maxLevel: scg.maxLevel, messages: scg.messages },
    iwp: { success: iwp.result.success, length: iwp.result.content?.length, maxLevel: iwp.maxLevel },
    iwpBin: { success: iwpBin.result.success, length: iwpBin.result.content?.length },
  }, 'scg-iwp')

  return { partId }
}
