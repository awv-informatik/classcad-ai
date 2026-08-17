export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoxTest' })).result

  const r = await api.v1.part.box({ id: partId, name: 'MyBox', length: 60, width: 40, height: 30 })
  console.log('[02] box result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'named-box-response')

  // Create a second box with different dimensions as reference
  const r2 = await api.v1.part.box({ id: partId, name: 'SmallBox', length: 20, width: 20, height: 80 })
  console.log('[02] second box result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('two-boxes')
  return { partId, boxId: r.result, box2Id: r2.result }
}
