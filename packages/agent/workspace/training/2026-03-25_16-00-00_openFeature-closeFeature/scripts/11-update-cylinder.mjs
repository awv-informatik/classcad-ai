// Verify open/update/close works on cylinder features too (not just box/workPlane)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'UpdateCyl' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 40, width: 40, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 30, height: 80 })).result
  console.log('[11] boxId:', boxId, 'cylId:', cylId)

  await snapshot('before')

  // open → update cylinder → close
  await api.v1.part.openFeature({ id: cylId })
  const r = await api.v1.part.updateCylinder({ id: cylId, radius: 10, height: 150 })
  console.log('[11] updateCylinder result:', r.result, 'maxLevel:', r.maxLevel)
  await api.v1.part.closeFeature({ id: cylId })

  await snapshot('after')

  return { partId, cylId }
}
