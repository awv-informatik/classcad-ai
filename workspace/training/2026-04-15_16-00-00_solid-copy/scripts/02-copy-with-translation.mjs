// Copy with translation — verify the copy appears at offset position
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyTranslate' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[02] boxId:', boxId)

  const copyId = (await api.v1.solid.copy({ id: eifId, target: boxId, translation: [80, 0, 0] })).result
  console.log('[02] copyId:', copyId)

  // Get graphic data to verify two distinct solids
  const r = await api.v1.solid.copy({ id: eifId, target: boxId, translation: [0, 80, 0] })
  console.log('[02] second copyId:', r.result, 'maxLevel:', r.maxLevel)
  filewrite(r.graphic, 'graphic-after-copies')

  await snapshot('two-copies')
  return { partId, eifId, boxId, copyId }
}
