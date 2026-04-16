// Save as STP + base64 → clear → load back — verify geometry survives format conversion
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'STPRoundtrip' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  await snapshot('stp-before')

  // Save as STP with encoding for transport
  const saved = await api.v1.common.save({ format: 'STP', encoding: 'base64' })
  console.log('[19] STP save success:', saved.result.success)
  console.log('[19] STP content length:', saved.result.content.length)

  // Clear
  await api.v1.common.clear({})

  // Load back
  const loadR = await api.v1.common.load({ data: saved.result.content, format: 'STP', encoding: 'base64' })
  console.log('[19] STP load result:', JSON.stringify(loadR.result))
  console.log('[19] STP load maxLevel:', loadR.maxLevel)
  console.log('[19] STP load messages:', JSON.stringify(loadR.messages?.slice(0, 3)))

  await snapshot('stp-after-roundtrip')

  filewrite({
    saveSuccess: saved.result.success,
    contentLength: saved.result.content.length,
    loadResult: loadR.result,
    loadMaxLevel: loadR.maxLevel,
  }, 'stp-roundtrip')

  return { partId: loadR.result?.id }
}
