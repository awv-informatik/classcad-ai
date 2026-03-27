// Proper open → updateBox → close pattern
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'ProperUpdate' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  console.log('[04] boxId:', boxId)

  // Add a small reference cylinder so size changes are visible in snapshots
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 10, height: 20 })).result
  console.log('[04] cylId (reference):', cylId)

  await snapshot('before-update')

  // open → update → close
  await api.v1.part.openFeature({ id: boxId })
  const updateRes = await api.v1.part.updateBox({ id: boxId, height: 120 })
  console.log('[04] updateBox result:', updateRes.result, 'maxLevel:', updateRes.maxLevel)
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-update')

  return { partId, boxId }
}
