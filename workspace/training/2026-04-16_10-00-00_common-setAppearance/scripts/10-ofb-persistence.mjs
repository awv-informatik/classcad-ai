// Test whether appearance (color, transparency, faceting) persists through OFB save/load
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PersistTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 30 })).result

  // Set distinctive appearance
  await api.v1.common.setAppearance({
    target: eifId,
    color: [255, 0, 0],
    transparency: 0.3,
    chordHeightTol: 3.0,
    angleTol: 30,
  })
  console.log('[10] appearance set on sphere')

  await snapshot('before-save')

  // Save to OFB
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[10] saved OFB, content length:', saveRes.content?.length || 0)

  // Clear
  await api.v1.common.clear({})

  // Load back
  const loadRes = (await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64', doClear: 'TRUE' })).result
  console.log('[10] loaded, id:', loadRes?.id)

  await api.v1.common.recalc({})
  await snapshot('after-load')

  return { partId }
}
