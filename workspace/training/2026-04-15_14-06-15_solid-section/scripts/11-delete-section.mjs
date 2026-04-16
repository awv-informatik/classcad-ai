// 11 — Can the section result be deleted? Try solid.deleteSolid on the section entity
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionDelete' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  const r = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })
  const sectionId = r.result
  console.log('[11] sectionId:', sectionId)

  await snapshot('with-section')

  // Try to delete the section entity
  const delR = await api.v1.solid.deleteSolid({ id: eifId, target: sectionId })
  console.log('[11] deleteSolid result:', delR.result)
  console.log('[11] deleteSolid maxLevel:', delR.maxLevel)
  console.log('[11] deleteSolid messages:', JSON.stringify(delR.messages))
  filewrite({ result: delR.result, messages: delR.messages, maxLevel: delR.maxLevel }, 'delete-response')

  await snapshot('after-delete')

  return { partId, eifId, boxId, sectionId }
}
