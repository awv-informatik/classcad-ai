// Full roundtrip: create → save → clear → load → modify → save again → verify
export default async function (api, { snapshot, filewrite }) {
  // Create original geometry
  const partId = (await api.v1.part.create({ name: 'RoundtripMod' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[11] Original — part:', partId, 'eif:', eifId, 'box:', boxId)

  await snapshot('original')

  // Save
  const saved1 = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })

  // Clear + Load
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({
    data: saved1.result.content,
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  const newPartId = loadR.result.id
  console.log('[11] Loaded part ID:', newPartId)

  await snapshot('after-load')

  // Modify: add a sphere to the loaded model
  // Need to find the entity injection in the loaded model
  // The EIF should still exist in the loaded structure — try using the same ID
  console.log('[11] Trying to add sphere to eifId:', eifId)
  const sphereR = await api.v1.solid.sphere({ id: eifId, radius: 20, translation: [100, 0, 0] })
  console.log('[11] Add sphere result:', sphereR.result, 'maxLevel:', sphereR.maxLevel)
  if (sphereR.maxLevel > 31) {
    console.log('[11] Sphere failed — messages:', JSON.stringify(sphereR.messages))
  }

  await snapshot('after-modify')

  // Save again
  const saved2 = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    compression: 'deflate',
  })
  console.log('[11] Second save success:', saved2.result.success, 'length:', saved2.result.content?.length)
  console.log('[11] First save length:', saved1.result.content?.length)

  filewrite({
    originalPartId: partId,
    loadedPartId: newPartId,
    sphereAdded: sphereR.maxLevel <= 31,
    save1Length: saved1.result.content?.length,
    save2Length: saved2.result.content?.length,
  }, 'roundtrip-modify')

  return { partId, newPartId }
}
