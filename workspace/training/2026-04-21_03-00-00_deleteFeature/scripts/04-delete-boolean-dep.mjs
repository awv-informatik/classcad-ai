export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a box (target) and cylinder (tool) for boolean subtraction
  const boxId = (await api.v1.part.box({ id: partId, length: 100, width: 80, height: 50 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 15, height: 80, position: [30, 20, -15] })).result
  console.log('[04] boxId:', boxId, 'cylId:', cylId)

  // Create boolean subtraction
  const boolId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: boxId, tools: [cylId] })).result
  console.log('[04] boolId:', boolId)

  await snapshot('before-with-boolean')

  // Try deleting the box (target of the boolean) — what happens to the boolean?
  const r1 = await api.v1.part.deleteFeature({ ids: [boxId] })
  console.log('[04] delete box (boolean target) — result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[04] messages:', JSON.stringify(r1.messages))

  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'delete-target-response')

  await snapshot('after-delete-target')

  return { partId }
}
