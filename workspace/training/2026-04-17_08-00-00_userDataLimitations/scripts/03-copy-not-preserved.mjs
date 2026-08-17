export default async function (api, { filewrite, snapshot }) {
  const partId = (await api.v1.part.create({ name: 'CopyTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create a solid box with correct params
  const boxR = await api.v1.solid.box({
    id: eifId,
    length: 50, width: 40, height: 30,
    translation: [-30, 0, 0]
  })
  const boxId = boxR.result
  console.log('[03] boxId:', boxId, 'maxLevel:', boxR.maxLevel)
  if (boxR.maxLevel > 31) {
    console.log('[03] box error:', JSON.stringify(boxR.messages))
    filewrite({ boxError: boxR.messages }, 'box-error')
    return { partId }
  }

  // Set user data on the original box
  await api.v1.common.setUserData({ id: boxId, key: 'material', value: 'steel' })
  await api.v1.common.setUserData({ id: boxId, key: 'color', value: 'blue' })
  await api.v1.common.setUserData({ id: boxId, key: 'weight', value: '42.5' })

  const origKeys = (await api.v1.common.getUserDataKeys({ id: boxId })).result
  console.log('[03] original box keys:', origKeys)

  // Copy the box
  const copyR = await api.v1.solid.copy({
    id: eifId,
    target: boxId,
    translation: [60, 0, 0]
  })
  const copyId = copyR.result
  console.log('[03] copyId:', copyId, 'maxLevel:', copyR.maxLevel)

  if (copyId) {
    const copyKeys = (await api.v1.common.getUserDataKeys({ id: copyId })).result
    const copyMaterial = (await api.v1.common.getUserData({ id: copyId, key: 'material', defaultValue: 'NOT_FOUND' })).result
    const copyColor = (await api.v1.common.getUserData({ id: copyId, key: 'color', defaultValue: 'NOT_FOUND' })).result
    const copyWeight = (await api.v1.common.getUserData({ id: copyId, key: 'weight', defaultValue: 'NOT_FOUND' })).result

    console.log('[03] copy keys:', copyKeys)
    console.log('[03] copy material:', copyMaterial)
    console.log('[03] copy color:', copyColor)
    console.log('[03] copy weight:', copyWeight)

    // Verify original is untouched
    const origMaterial = (await api.v1.common.getUserData({ id: boxId, key: 'material' })).result
    console.log('[03] original material still:', origMaterial)

    await snapshot('copy-test')

    filewrite({
      original: { id: boxId, keys: origKeys, material: origMaterial },
      copy: { id: copyId, keys: copyKeys, material: copyMaterial, color: copyColor, weight: copyWeight },
    }, 'copy-results')
  } else {
    console.log('[03] copy failed:', JSON.stringify(copyR.messages))
    filewrite({ copyError: copyR.messages }, 'copy-error')
  }

  return { partId }
}
