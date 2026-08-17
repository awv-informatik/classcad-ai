export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Create a box with user data
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result
  await api.v1.common.setUserData({ id: boxId, key: 'tag', value: 'original' })

  const origKeys = (await api.v1.common.getUserDataKeys({ id: boxId })).result
  const origVal = (await api.v1.common.getUserData({ id: boxId, key: 'tag' })).result
  console.log('[09] original box keys:', JSON.stringify(origKeys), 'tag:', JSON.stringify(origVal))

  // Copy the box
  const copyId = (await api.v1.solid.copy({ id: eifId, target: boxId, translation: [0, 60, 0] })).result
  console.log('[09] copy id:', copyId)

  // Check if user data was copied
  const copyKeys = (await api.v1.common.getUserDataKeys({ id: copyId })).result
  const copyVal = (await api.v1.common.getUserData({ id: copyId, key: 'tag', defaultValue: 'NOT_COPIED' })).result
  console.log('[09] copy box keys:', JSON.stringify(copyKeys), 'tag:', JSON.stringify(copyVal))

  // Also set user data on entity injection and test if part features copy
  await api.v1.common.setUserData({ id: eifId, key: 'feature-data', value: 'eif-value' })

  filewrite({
    original: { id: boxId, keys: origKeys, tag: origVal },
    copy: { id: copyId, keys: copyKeys, tag: copyVal },
  }, 'copy-behavior')

  return { partId }
}
