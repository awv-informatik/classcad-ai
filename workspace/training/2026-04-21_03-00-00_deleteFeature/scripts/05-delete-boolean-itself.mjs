export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 100, width: 80, height: 50 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 15, height: 80, position: [30, 20, -15] })).result
  const boolId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: boxId, tools: [cylId] })).result
  console.log('[05] boxId:', boxId, 'cylId:', cylId, 'boolId:', boolId)

  await snapshot('before-with-boolean')

  // Delete the boolean itself — target and tool should survive
  const r = await api.v1.part.deleteFeature({ ids: [boolId] })
  console.log('[05] delete boolean — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[05] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-boolean-response')

  await snapshot('after-delete-boolean')

  // Check if box and cylinder survive
  const boxLookup = await api.v1.part.getFeature({ id: partId, name: 'Box' })
  const cylLookup = await api.v1.part.getFeature({ id: partId, name: 'Cylinder' })
  console.log('[05] box after bool delete — result:', boxLookup.result, 'maxLevel:', boxLookup.maxLevel)
  console.log('[05] cyl after bool delete — result:', cylLookup.result, 'maxLevel:', cylLookup.maxLevel)

  return { partId }
}
