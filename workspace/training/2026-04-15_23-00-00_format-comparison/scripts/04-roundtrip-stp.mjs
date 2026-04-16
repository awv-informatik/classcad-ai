// STP roundtrip fidelity test
// Save with expressions + booleans, reload, check what's preserved/lost
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RoundtripSTP' })).result

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
  console.log('[04] Before save — partId:', partId, 'eifId:', eifId, 'boxId:', boxId)

  // Save STP (AP214 default)
  const saved = await api.v1.common.save({ format: 'STP', encoding: 'base64' })
  const data = saved.result.content
  console.log('[04] Saved STP — size:', data.length, 'success:', saved.result.success)

  // Clear and reload
  await api.v1.common.clear({})
  const loaded = await api.v1.common.load({ data, format: 'STP', encoding: 'base64' })
  console.log('[04] Loaded — id:', loaded.result?.id, 'maxLevel:', loaded.maxLevel)

  const newPartId = loaded.result.id
  console.log('[04] ID preserved?', newPartId === partId ? 'YES' : `NO — was ${partId}, now ${newPartId}`)

  // Check if expressions survived
  try {
    const widthAfter = await api.v1.part.getExpression({ id: newPartId, name: 'width' })
    console.log('[04] Expression "width" after STP load:', JSON.stringify(widthAfter.result), 'maxLevel:', widthAfter.maxLevel)
  } catch (e) {
    console.log('[04] Expression "width" after STP load: ERROR —', e.message)
  }

  await snapshot('after-load')

  // Save loaded structure to inspect what survived
  const structure = (await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })).result
  console.log('[04] OFB re-save after STP load — size:', structure.content?.length)

  filewrite({
    idPreserved: newPartId === partId,
    beforePartId: partId,
    afterPartId: newPartId,
    stpSize: data.length,
  }, 'stp-roundtrip')

  return { partId: newPartId }
}
