export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NoOpenTest' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 50, width: 50, height: 50 })).result

  // Try updateBox WITHOUT openFeature — should fail
  const ur = await api.v1.part.updateBox({ id: boxId, length: 100 })
  console.log('[11] update without open - result:', ur.result, 'maxLevel:', ur.maxLevel)
  console.log('[11] messages:', JSON.stringify(ur.messages))
  filewrite({ result: ur.result, messages: ur.messages, maxLevel: ur.maxLevel }, 'no-open-response')

  return { partId, boxId }
}
