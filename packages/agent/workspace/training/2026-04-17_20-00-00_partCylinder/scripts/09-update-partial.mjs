export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylPartial' })).result
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 30, width: 30, height: 30 })

  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 60, height: 80 })).result
  await snapshot('before')

  // Partial update: only change height, leave diameter
  await api.v1.part.openFeature({ id: cylId })
  const r1 = await api.v1.part.updateCylinder({ id: cylId, height: 200 })
  console.log('[09] partial height-only result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'partial-height')
  await api.v1.part.closeFeature({ id: cylId })
  await snapshot('after-height-only')

  // Partial update: only change diameter, leave height
  await api.v1.part.openFeature({ id: cylId })
  const r2 = await api.v1.part.updateCylinder({ id: cylId, diameter: 120 })
  console.log('[09] partial diameter-only result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'partial-diameter')
  await api.v1.part.closeFeature({ id: cylId })
  await snapshot('after-diameter-only')

  return { partId, cylId }
}
