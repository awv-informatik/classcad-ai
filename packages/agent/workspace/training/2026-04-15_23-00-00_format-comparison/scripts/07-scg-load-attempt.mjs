// Confirm SCG is export-only: save as SCG, then attempt to load
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScgTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save as SCG
  const saved = await api.v1.common.save({ format: 'SCG', encoding: 'base64' })
  console.log('[07] SCG save — success:', saved.result?.success, 'size:', saved.result?.content?.length)

  // Clear and attempt load
  await api.v1.common.clear({})
  const loaded = await api.v1.common.load({ data: saved.result.content, format: 'SCG', encoding: 'base64' })
  console.log('[07] SCG load — result:', JSON.stringify(loaded.result), 'maxLevel:', loaded.maxLevel)
  if (loaded.messages?.length) {
    loaded.messages.forEach(m => console.log('[07] msg:', m.message, 'level:', m.level, 'code:', m.code))
  }

  filewrite({
    saveSuccess: saved.result?.success,
    loadResult: loaded.result,
    loadMaxLevel: loaded.maxLevel,
    loadMessages: loaded.messages,
  }, 'scg-load-attempt')

  return { partId }
}
