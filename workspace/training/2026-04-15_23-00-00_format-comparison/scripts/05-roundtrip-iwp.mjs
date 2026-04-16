// IWP roundtrip fidelity test
// What does IWP preserve vs lose compared to OFB/STP?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RoundtripIWP' })).result

  // Create expressions
  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'width', value: 80 },
      { name: 'height', value: 'width * 0.5' },
    ],
  })

  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 20, translation: [40, 30, -10] })).result
  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cylId] })

  await snapshot('before-save')
  console.log('[05] Before save — partId:', partId, 'eifId:', eifId)

  // Save IWP binary
  const saved = await api.v1.common.save({ format: 'IWP', encoding: 'base64', iwp: { binary: 1 } })
  const data = saved.result.content
  console.log('[05] Saved IWP binary — size:', data.length, 'success:', saved.result.success)

  // Clear and reload
  await api.v1.common.clear({})
  const loaded = await api.v1.common.load({ data, format: 'IWP', encoding: 'base64' })
  console.log('[05] Loaded — id:', loaded.result?.id, 'maxLevel:', loaded.maxLevel)
  if (loaded.messages?.length) {
    loaded.messages.forEach(m => console.log('[05] msg:', m.message, 'level:', m.level))
  }

  const newPartId = loaded.result?.id
  console.log('[05] ID preserved?', newPartId === partId ? 'YES' : `NO — was ${partId}, now ${newPartId}`)

  // Check if expressions survived
  try {
    const widthAfter = await api.v1.part.getExpression({ id: newPartId, name: 'width' })
    console.log('[05] Expression "width" after IWP load:', JSON.stringify(widthAfter.result), 'maxLevel:', widthAfter.maxLevel)
  } catch (e) {
    console.log('[05] Expression "width" after IWP load: ERROR —', e.message)
  }

  await snapshot('after-load')

  filewrite({
    idPreserved: newPartId === partId,
    beforePartId: partId,
    afterPartId: newPartId,
    iwpSize: data.length,
  }, 'iwp-roundtrip')

  return { partId: newPartId }
}
