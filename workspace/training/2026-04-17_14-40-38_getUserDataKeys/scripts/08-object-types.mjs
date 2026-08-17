export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TypeTest' })).result

  // Set keys on part
  await api.v1.common.setUserData({ id: partId, key: 'part-key', value: 'part-val' })

  // Create entity injection and set keys on it
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  console.log('[08] eifId:', eifId)
  if (eifId) {
    await api.v1.common.setUserData({ id: eifId, key: 'eif-key', value: 'eif-val' })
    const eifKeys = (await api.v1.common.getUserDataKeys({ id: eifId })).result
    console.log('[08] eif keys:', JSON.stringify(eifKeys))
  }

  // Create sketch and set keys on it
  const skId = (await api.v1.sketch.create({ id: partId })).result
  console.log('[08] sketchId:', skId)
  if (skId) {
    await api.v1.common.setUserData({ id: skId, key: 'sketch-key', value: 'sketch-val' })
    const skKeys = (await api.v1.common.getUserDataKeys({ id: skId })).result
    console.log('[08] sketch keys:', JSON.stringify(skKeys))
  }

  // Create a box solid via entity injection
  const boxId = (await api.v1.solid.box({ id: eifId, xLen: 50, yLen: 50, zLen: 50 })).result
  console.log('[08] boxId:', boxId, '(solid.box returns VOID expected)')

  // Part keys should be independent
  const partKeys = (await api.v1.common.getUserDataKeys({ id: partId })).result
  console.log('[08] part keys (should only have part-key):', JSON.stringify(partKeys))

  // Create work geometry
  const wpId = (await api.v1.part.workPlane({ id: partId })).result
  console.log('[08] workPlaneId:', wpId)
  if (wpId) {
    await api.v1.common.setUserData({ id: wpId, key: 'wp-key', value: 'wp-val' })
    const wpKeys = (await api.v1.common.getUserDataKeys({ id: wpId })).result
    console.log('[08] workPlane keys:', JSON.stringify(wpKeys))
  }

  filewrite({
    partId, partKeys,
    eifId, skId, boxId, wpId
  }, 'object-types')

  return { partId }
}
