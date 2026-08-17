export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceConsume' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box', length: 60, width: 40, height: 50 })).result
  const topWpId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result

  const sliceId = (await api.v1.part.slice({
    id: partId,
    targets: [{ id: boxId }],
    reference: topWpId,
  })).result
  console.log('[12] sliceId:', sliceId)

  // Try to use the original box feature ID after slice — is it consumed?
  const boolR = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: boxId,
    tools: [sliceId],
  })
  console.log('[12] reuse boxId result:', boolR.result, 'maxLevel:', boolR.maxLevel)
  filewrite({ result: boolR.result, messages: boolR.messages, maxLevel: boolR.maxLevel }, 'reuse-box-response')

  // Also try using the slice feature ID as a target for another operation
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl', diameter: 10, height: 30, translation: [30, 20, -5] })).result
  const boolR2 = await api.v1.part.boolean({
    id: partId,
    type: 'SUBTRACTION',
    target: sliceId,
    tools: [cylId],
  })
  console.log('[12] use sliceId as target result:', boolR2.result, 'maxLevel:', boolR2.maxLevel)
  filewrite({ result: boolR2.result, messages: boolR2.messages, maxLevel: boolR2.maxLevel }, 'use-slice-response')

  if (boolR2.result) await snapshot('after-sub')

  return { partId, sliceId, boolResult: boolR2.result }
}
