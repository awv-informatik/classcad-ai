// Fixed persistence test — check if faceting survives OFB roundtrip (doClear: 1)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PersistV2' })).result
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
  console.log('[12] OFB saved, content length:', saveRes.content?.length)

  // Load back with doClear: 1
  const loadRes = await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64', doClear: 1 })
  console.log('[12] load result:', JSON.stringify(loadRes.result), 'maxLevel:', loadRes.maxLevel)

  await api.v1.common.recalc({})
  await snapshot('after-load')

  // Compare snapshot file sizes — if faceting persisted, the after-load should also be coarse
  return {}
}
