export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20 })).result

  // Set user data on the original solid
  await api.v1.common.setUserData({ id: boxId, key: 'origin', value: 'original' })
  const origR = (await api.v1.common.getUserData({ id: boxId, key: 'origin' })).result
  console.log('[12] original solid userData:', origR)

  // Copy the solid
  const copyId = (await api.v1.solid.copy({ id: eifId, target: boxId, translation: [30, 0, 0] })).result
  console.log('[12] original boxId:', boxId, 'copyId:', copyId)

  // Check if user data was copied
  const copyR = await api.v1.common.getUserData({ id: copyId, key: 'origin', defaultValue: '__NOT_COPIED__' })
  console.log('[12] copied solid userData:', copyR.result)

  // Also verify original still has its data
  const origAfter = (await api.v1.common.getUserData({ id: boxId, key: 'origin' })).result
  console.log('[12] original still has data:', origAfter)

  filewrite({
    originalValue: origR,
    copyValue: copyR.result,
    wasCopied: copyR.result !== '__NOT_COPIED__',
    originalStillHasData: origAfter === 'original',
  }, 'not-copied-on-dup')

  return { partId }
}
