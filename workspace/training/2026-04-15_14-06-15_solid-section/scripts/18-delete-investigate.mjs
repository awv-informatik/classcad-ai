// 18 — Investigate what deleteSolid actually does to a section entity
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionDeleteInv' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  console.log('[18] boxId:', boxId)

  const sectionR = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })
  const sectionId = sectionR.result
  console.log('[18] sectionId:', sectionId)

  // Dump structure BEFORE delete
  filewrite(sectionR.structure, 'structure-before')

  // Check the part's solids array
  const tree = sectionR.structure?.tree || {}
  const partNode = tree[String(partId)]
  console.log('[18] part solids before delete:', JSON.stringify(partNode?.solids))

  // Delete the section
  const delR = await api.v1.solid.deleteSolid({ id: eifId, target: sectionId })
  console.log('[18] delete result:', delR.result, 'maxLevel:', delR.maxLevel)
  console.log('[18] delete messages:', JSON.stringify(delR.messages))

  // Dump structure AFTER delete
  filewrite(delR.structure, 'structure-after')

  const partNodeAfter = delR.structure?.tree?.[String(partId)]
  console.log('[18] part solids after delete:', JSON.stringify(partNodeAfter?.solids))

  // Check if box is still usable
  const sliceR = await api.v1.solid.slice({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[18] box usable after delete? slice maxLevel:', sliceR.maxLevel)

  await snapshot('final')

  return { partId, eifId, boxId, sectionId }
}
