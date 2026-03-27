// Realistic: sequential open/update/close on two different features
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Sequential' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 30, height: 20 })).result
  console.log('[13] boxId:', boxId, 'cylId:', cylId)

  await snapshot('initial')

  // Edit box first
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 100 })
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-box-edit')

  // Then edit cylinder
  await api.v1.part.openFeature({ id: cylId })
  await api.v1.part.updateCylinder({ id: cylId, radius: 10, height: 80 })
  await api.v1.part.closeFeature({ id: cylId })

  await snapshot('after-both-edits')

  return { partId, boxId, cylId }
}
