export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IsolationTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  console.log('[05] partId:', partId, 'eifId:', eifId)

  // Set keys on both objects
  await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  await api.v1.common.setUserData({ id: partId, key: 'color', value: 'red' })
  await api.v1.common.setUserData({ id: eifId, key: 'material', value: 'aluminum' })
  await api.v1.common.setUserData({ id: eifId, key: 'weight', value: '500g' })

  const partKeysBefore = (await api.v1.common.getUserDataKeys({ id: partId })).result
  const eifKeysBefore = (await api.v1.common.getUserDataKeys({ id: eifId })).result
  console.log('[05] before clear — part keys:', JSON.stringify(partKeysBefore))
  console.log('[05] before clear — eif keys:', JSON.stringify(eifKeysBefore))

  // Clear ONLY part
  await api.v1.common.clearUserData({ id: partId })

  const partKeysAfter = (await api.v1.common.getUserDataKeys({ id: partId })).result
  const eifKeysAfter = (await api.v1.common.getUserDataKeys({ id: eifId })).result
  console.log('[05] after clear part — part keys:', JSON.stringify(partKeysAfter))
  console.log('[05] after clear part — eif keys:', JSON.stringify(eifKeysAfter))

  // Verify eif data intact
  const eifMat = (await api.v1.common.getUserData({ id: eifId, key: 'material' })).result
  console.log('[05] eif material still:', eifMat)

  filewrite({
    partKeysBefore, eifKeysBefore,
    partKeysAfter, eifKeysAfter,
    eifMaterialAfterPartClear: eifMat,
  }, 'isolation-response')

  return { partId }
}
