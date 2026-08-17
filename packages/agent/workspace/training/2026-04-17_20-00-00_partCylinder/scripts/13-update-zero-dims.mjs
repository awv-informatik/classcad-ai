export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylUpdZero' })).result

  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 60, height: 80 })).result
  await snapshot('before')

  // Try updating to zero diameter
  await api.v1.part.openFeature({ id: cylId })
  const r1 = await api.v1.part.updateCylinder({ id: cylId, diameter: 0 })
  console.log('[13] zero diam update result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[13] zero diam msgs:', JSON.stringify(r1.messages))
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'zero-diam-update')
  await api.v1.part.closeFeature({ id: cylId })
  await snapshot('after-zero-diam')

  // Recover with valid values
  await api.v1.part.openFeature({ id: cylId })
  const r2 = await api.v1.part.updateCylinder({ id: cylId, diameter: 60, height: 80 })
  console.log('[13] recovery result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'recovery')
  await api.v1.part.closeFeature({ id: cylId })
  await snapshot('after-recovery')

  return { partId, cylId }
}
