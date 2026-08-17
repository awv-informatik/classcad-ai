export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'PersistTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 30, height: 40, translation: [80, 0, 0] })).result

  // Set appearance before save
  await api.v1.part.setAppearance({ target: boxId, color: [255, 0, 0], transparency: 0.4 })
  await api.v1.part.setAppearance({ target: cylId, color: [0, 0, 255], chordHeightTol: 0.5, angleTol: 10 })

  // Save to OFB
  const saveRes = (await api.v1.common.save({ format: 'OFB', encoding: 'base64' })).result
  console.log('[10] saved, content length:', saveRes.content?.length)

  await snapshot('before-reload')

  // Clear and reload
  await api.v1.common.clear({})
  const loadRes = (await api.v1.common.load({ data: saveRes.content, format: 'OFB', encoding: 'base64' })).result
  console.log('[10] loaded, root ID:', loadRes?.id)
  await api.v1.common.recalc({})

  await snapshot('after-reload')

  // Get the structure to find reloaded feature IDs
  const struct = await api.v1.common.recalc({})
  filewrite(struct.structure, 'reloaded-structure')

  return { partId: loadRes?.id }
}
