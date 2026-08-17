// What happens if you open a box but call updateCylinder on it?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'WrongType' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[12] boxId:', boxId)

  await api.v1.part.openFeature({ id: boxId })

  // Try updateCylinder on a box feature
  const r = await api.v1.part.updateCylinder({ id: boxId, radius: 50 })
  console.log('[12] updateCylinder on box — result:', r.result, 'maxLevel:', r.maxLevel)
  if (r.messages) {
    for (const m of r.messages) console.log('[12] msg:', m.level, m.message)
  }

  await api.v1.part.closeFeature({ id: boxId })

  return { partId, boxId }
}
