export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PersistTest2' })).result
  console.log('[11] original partId:', partId)

  // Add some geometry to make it a non-empty drawing
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30 })).result
  console.log('[11] boxId:', boxId)

  // Set user data on both part and box
  await api.v1.common.setUserData({ id: partId, key: 'partTag', value: 'myPart' })
  await api.v1.common.setUserData({ id: boxId, key: 'boxTag', value: 'myBox' })

  // Save
  const saveR = await api.v1.common.save({ format: 'OFB' })
  console.log('[11] save:', saveR.result?.success ? '✓' : '❌')

  const content = saveR.result.content

  // Clear
  await api.v1.common.clear({})

  // Load with doClear option
  const loadR = await api.v1.common.load({ data: content, format: 'OFB', doClear: true })
  console.log('[11] load maxLevel:', loadR.maxLevel, 'result:', loadR.result)

  // Scan IDs up to 200 for any user data
  const found = []
  for (let id = 1; id <= 200; id++) {
    try {
      const keys = await api.v1.common.getUserDataKeys({ id })
      if (keys.result && keys.result.length > 0) {
        const values = {}
        for (const k of keys.result) {
          values[k] = (await api.v1.common.getUserData({ id, key: k })).result
        }
        found.push({ id, keys: keys.result, values })
        console.log('[11] found user data at id', id, ':', keys.result, values)
      }
    } catch (e) {
      // skip
    }
  }

  console.log('[11] total objects with user data:', found.length)

  filewrite({
    originalIds: { partId, boxId },
    loadResult: loadR.result,
    foundAfterLoad: found,
  }, 'thorough-persistence')

  return { partId }
}
