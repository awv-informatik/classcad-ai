export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PersistTest' })).result

  // Set user data
  await api.v1.common.setUserData({ id: partId, key: 'material', value: 'steel' })
  await api.v1.common.setUserData({ id: partId, key: 'author', value: 'cc-agent' })
  await api.v1.common.setUserData({ id: partId, key: 'unicode', value: '日本語テスト' })

  const keysBefore = (await api.v1.common.getUserDataKeys({ id: partId })).result
  const matBefore = (await api.v1.common.getUserData({ id: partId, key: 'material' })).result
  console.log('[08] before save: keys=', keysBefore, 'material=', matBefore)

  // Save to OFB (data string)
  const saveR = await api.v1.common.save({ format: 'OFB' })
  console.log('[08] save maxLevel:', saveR.maxLevel, 'success:', saveR.result?.success)
  if (!saveR.result?.success) {
    console.log('[08] save failed:', JSON.stringify(saveR.messages))
    return { partId }
  }
  const saveContent = saveR.result.content

  // Clear drawing
  await api.v1.common.clear({})

  // Load back
  const loadR = await api.v1.common.load({ data: saveContent, format: 'OFB' })
  console.log('[08] load maxLevel:', loadR.maxLevel)

  // Find the part - structure has tree of loaded objects
  // Try getting all parts via getObjectsByType or scanning structure
  // The loaded drawing should have the same part
  // Use a simple approach: try IDs starting from 4 (typical part ID)
  let loadedPartId = null
  for (let testId = 1; testId < 100; testId++) {
    const testKeys = await api.v1.common.getUserDataKeys({ id: testId })
    if (testKeys.result && testKeys.result.length > 0) {
      loadedPartId = testId
      break
    }
  }

  console.log('[08] loadedPartId:', loadedPartId)

  if (loadedPartId) {
    const keysAfter = (await api.v1.common.getUserDataKeys({ id: loadedPartId })).result
    const matAfter = (await api.v1.common.getUserData({ id: loadedPartId, key: 'material', defaultValue: 'NOT_FOUND' })).result
    const authorAfter = (await api.v1.common.getUserData({ id: loadedPartId, key: 'author', defaultValue: 'NOT_FOUND' })).result
    const unicodeAfter = (await api.v1.common.getUserData({ id: loadedPartId, key: 'unicode', defaultValue: 'NOT_FOUND' })).result

    console.log('[08] after load: keys=', keysAfter)
    console.log('[08] material=', matAfter, 'author=', authorAfter, 'unicode=', unicodeAfter)

    filewrite({
      before: { partId, keys: keysBefore, material: matBefore },
      after: { partId: loadedPartId, keys: keysAfter, material: matAfter, author: authorAfter, unicode: unicodeAfter },
      persisted: keysAfter && keysAfter.length > 0,
    }, 'persistence-results')
  } else {
    console.log('[08] no object with user data found after load')
    filewrite({ error: 'no user data found after load' }, 'persistence-error')
  }

  return { partId }
}
