// 16 — Realistic workflow: part → entity injection → box + cylinder in same EI
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Workflow' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Geometry' })).result
  console.log('[16] partId:', partId, 'eifId:', eifId)

  // Create a box
  const boxId = (await api.v1.solid.box({ id: eifId, length: 100, width: 60, height: 40 })).result
  console.log('[16] boxId:', boxId)

  // Create a cylinder offset to the side — param is "diameter" not "radius"
  const cylR = await api.v1.solid.cylinder({
    id: eifId, diameter: 40, height: 60, translation: [130, 30, 0]
  })
  console.log('[16] cylId:', cylR.result, 'maxLevel:', cylR.maxLevel)
  if (cylR.messages?.length) console.log('[16] cyl messages:', JSON.stringify(cylR.messages))

  await snapshot('workflow-two-solids')

  // Inspect the EI children
  const tree = cylR.structure?.tree
  const finalEI = tree?.[eifId]
  console.log('[16] EI children:', JSON.stringify(finalEI?.children))
  console.log('[16] part.solids:', JSON.stringify(tree?.[partId]?.solids))
  filewrite({ eiChildren: finalEI?.children, partSolids: tree?.[partId]?.solids }, 'workflow-ids')

  return { partId, eifId, boxId, cylId: cylR.result }
}
