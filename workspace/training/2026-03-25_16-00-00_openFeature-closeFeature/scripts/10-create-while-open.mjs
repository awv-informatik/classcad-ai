// Can you create a new feature while another is open?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'CreateWhileOpen' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[10] boxId:', boxId)

  // Open box
  await api.v1.part.openFeature({ id: boxId })

  // Try to create a cylinder while box is open
  const cylRes = await api.v1.part.cylinder({ id: partId, radius: 20, height: 50 })
  console.log('[10] cylinder create while box open — result:', cylRes.result, 'maxLevel:', cylRes.maxLevel)
  if (cylRes.messages) {
    for (const m of cylRes.messages) console.log('[10] msg:', m.level, m.message)
  }

  await api.v1.part.closeFeature({ id: boxId })

  return { partId, boxId }
}
