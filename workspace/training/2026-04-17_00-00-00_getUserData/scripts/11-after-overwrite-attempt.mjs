export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Set a value
  await api.v1.common.setUserData({ id: partId, key: 'color', value: 'red' })
  const r1 = (await api.v1.common.getUserData({ id: partId, key: 'color' })).result
  console.log('[11] after first set:', r1)

  // Attempt to overwrite (setUserData doc says this is a silent no-op)
  const overwriteR = await api.v1.common.setUserData({ id: partId, key: 'color', value: 'blue' })
  console.log('[11] overwrite attempt maxLevel:', overwriteR.maxLevel)
  const r2 = (await api.v1.common.getUserData({ id: partId, key: 'color' })).result
  console.log('[11] after overwrite attempt:', r2)
  console.log('[11] value changed:', r1 !== r2)

  // Proper update: remove then set
  await api.v1.common.removeUserData({ id: partId, key: 'color' })
  await api.v1.common.setUserData({ id: partId, key: 'color', value: 'blue' })
  const r3 = (await api.v1.common.getUserData({ id: partId, key: 'color' })).result
  console.log('[11] after remove+set:', r3)

  filewrite({
    firstSet: r1,
    afterOverwriteAttempt: r2,
    overwriteWorked: r1 !== r2,
    afterProperUpdate: r3,
  }, 'overwrite-attempt')

  return { partId }
}
