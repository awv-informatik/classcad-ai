// Can you copy a solid from one EIF into a different EIF?
// The docs say: id = "entity injection feature to create copy in", target = "solid to copy"
// So target is from any EIF, id is the destination EIF.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossEIF' })).result
  const eif1 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const eif2 = (await api.v1.part.entityInjection({ id: partId, name: 'EIF2' })).result

  console.log('[10] eif1:', eif1, 'eif2:', eif2)

  // Create a box in EIF1
  const boxId = (await api.v1.solid.box({ id: eif1, length: 60, width: 40, height: 30 })).result
  console.log('[10] boxId (in eif1):', boxId)

  // Try to copy it into EIF2
  const r = await api.v1.solid.copy({ id: eif2, target: boxId, translation: [80, 0, 0] })
  console.log('[10] cross-EIF copy result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'cross-eif-response')

  if (r.result) {
    await snapshot('cross-eif-result')
  }

  return { partId, eif1, eif2, boxId, copyId: r.result }
}
