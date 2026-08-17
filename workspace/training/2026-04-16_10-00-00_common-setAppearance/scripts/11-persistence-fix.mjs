// Fixed persistence test — check if faceting survives OFB roundtrip
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PersistFix' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 30 })).result

  // Set coarse faceting (visually distinctive)
  await api.v1.common.setAppearance({
    target: eifId,
    color: [255, 0, 0],
    transparency: 0.3,
    chordHeightTol: 3.0,
    angleTol: 30,
  })
  await api.v1.common.recalc({})
  await snapshot('before-save')

  // Save to OFB
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[11] OFB saved, content length:', saveRes.content?.length)

  // Clear and load back
  await api.v1.common.clear({})

  const loadRes = await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64', doClear: 'TRUE' })
  console.log('[11] load result:', loadRes.result, 'maxLevel:', loadRes.maxLevel)
  filewrite({ result: loadRes.result, messages: loadRes.messages, maxLevel: loadRes.maxLevel }, 'load-response')

  await api.v1.common.recalc({})
  await snapshot('after-load')

  return {}
}
