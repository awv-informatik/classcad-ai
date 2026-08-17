// What happens if you call closeFeature without opening first?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'CloseNoOpen' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[06] boxId:', boxId)

  // Try closing without opening first
  const r = await api.v1.part.closeFeature({ id: boxId })
  console.log('[06] closeFeature without open — result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) {
    for (const m of r.messages) console.log('[06] msg:', m.level, m.message)
  }

  return { partId, boxId }
}
