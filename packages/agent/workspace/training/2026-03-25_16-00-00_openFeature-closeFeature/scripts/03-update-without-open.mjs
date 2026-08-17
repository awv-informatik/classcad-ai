// What happens if you call updateBox WITHOUT openFeature first?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'NoOpen' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[03] boxId:', boxId)

  await snapshot('before')

  // Try to update WITHOUT opening first
  const updateRes = await api.v1.part.updateBox({ id: boxId, height: 120 })
  console.log('[03] updateBox without open — result:', updateRes.result, 'maxLevel:', updateRes.maxLevel)
  if (updateRes.messages) {
    for (const m of updateRes.messages) {
      console.log('[03] msg:', m.level, m.message)
    }
  }

  await snapshot('after-no-open')

  return { partId, boxId, updateRes }
}
