export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SaveLoadTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result

  // Mass props before save
  const rBefore = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[18] before save:', JSON.stringify(rBefore.result))

  // Save
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result

  // Clear
  await api.v1.common.clear({})

  // Load
  const loadRes = (await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64' })).result
  console.log('[18] loaded partId:', loadRes.id)

  // Mass props after load
  const rAfter = await api.v1.part.calculateMassProperties({ id: loadRes.id })
  console.log('[18] after load:', JSON.stringify(rAfter.result))
  console.log('[18] maxLevel:', rAfter.maxLevel)

  filewrite({
    before: rBefore.result,
    after: rAfter.result,
    volumeMatch: rBefore.result?.volume === rAfter.result?.volume,
  }, 'save-load')

  return { partId: loadRes.id }
}
