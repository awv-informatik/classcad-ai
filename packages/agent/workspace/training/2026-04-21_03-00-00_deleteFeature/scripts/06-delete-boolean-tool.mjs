export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const boxId = (await api.v1.part.box({ id: partId, length: 100, width: 80, height: 50 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 15, height: 80, position: [30, 20, -15] })).result
  const boolId = (await api.v1.part.boolean({ id: partId, type: 'SUBTRACTION', target: boxId, tools: [cylId] })).result
  console.log('[06] boxId:', boxId, 'cylId:', cylId, 'boolId:', boolId)

  await snapshot('before')

  // Delete the cylinder (tool of the boolean) — what happens?
  const r = await api.v1.part.deleteFeature({ ids: [cylId] })
  console.log('[06] delete cyl (boolean tool) — result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[06] messages:', JSON.stringify(r.messages))

  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-tool-response')

  await snapshot('after-delete-tool')

  return { partId }
}
