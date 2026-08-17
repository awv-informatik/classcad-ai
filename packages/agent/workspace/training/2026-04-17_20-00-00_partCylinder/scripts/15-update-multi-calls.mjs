export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylMultiUpd' })).result
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 30, width: 30, height: 30 })

  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 60, height: 80 })).result
  await snapshot('before')

  // Multiple updateCylinder calls within a single open/close session
  await api.v1.part.openFeature({ id: cylId })
  const r1 = await api.v1.part.updateCylinder({ id: cylId, diameter: 100 })
  console.log('[15] first update (diam=100) result:', r1.result, 'maxLevel:', r1.maxLevel)
  const r2 = await api.v1.part.updateCylinder({ id: cylId, height: 200 })
  console.log('[15] second update (height=200) result:', r2.result, 'maxLevel:', r2.maxLevel)
  const r3 = await api.v1.part.updateCylinder({ id: cylId, name: 'BigCyl' })
  console.log('[15] third update (name) result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ r1: { result: r1.result, maxLevel: r1.maxLevel }, r2: { result: r2.result, maxLevel: r2.maxLevel }, r3: { result: r3.result, maxLevel: r3.maxLevel } }, 'multi-calls')
  await api.v1.part.closeFeature({ id: cylId })

  await snapshot('after-multi')
  return { partId, cylId }
}
