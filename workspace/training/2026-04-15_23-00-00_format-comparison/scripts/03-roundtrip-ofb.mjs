// OFB roundtrip fidelity test
// Save with expressions + booleans, reload, check everything preserved
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RoundtripOFB' })).result

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

  // Capture pre-save state
  const widthBefore = (await api.v1.part.getExpression({ id: partId, name: 'width' })).result
  const heightBefore = (await api.v1.part.getExpression({ id: partId, name: 'height' })).result
  console.log('[03] Before save — width:', JSON.stringify(widthBefore), 'height:', JSON.stringify(heightBefore))
  console.log('[03] Before save — partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Save OFB with deflate+base64
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  const data = saved.result.content
  console.log('[03] Saved OFB — size:', data.length, 'success:', saved.result.success)

  // Clear and reload
  await api.v1.common.clear({})
  const loaded = await api.v1.common.load({ data, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[03] Loaded — id:', loaded.result?.id, 'maxLevel:', loaded.maxLevel)

  // Check ID preservation
  const newPartId = loaded.result.id
  console.log('[03] ID preserved?', newPartId === partId ? 'YES' : `NO — was ${partId}, now ${newPartId}`)

  // Check expressions
  const widthAfter = (await api.v1.part.getExpression({ id: newPartId, name: 'width' })).result
  const heightAfter = (await api.v1.part.getExpression({ id: newPartId, name: 'height' })).result
  console.log('[03] After load — width:', JSON.stringify(widthAfter), 'height:', JSON.stringify(heightAfter))

  await snapshot('after-load')

  filewrite({
    idPreserved: newPartId === partId,
    beforePartId: partId,
    afterPartId: newPartId,
    widthBefore, widthAfter,
    heightBefore, heightAfter,
    expressionsPreserved: widthAfter?.value === widthBefore?.value && heightAfter?.value === heightBefore?.value,
  }, 'ofb-roundtrip')

  return { partId: newPartId }
}
