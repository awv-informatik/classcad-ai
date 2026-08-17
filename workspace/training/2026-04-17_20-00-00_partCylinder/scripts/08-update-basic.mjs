export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylUpdate' })).result

  // Create a reference box for visual comparison
  await api.v1.part.box({ id: partId, name: 'RefBox', length: 30, width: 30, height: 30 })

  // Create cylinder
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 60, height: 80 })).result
  console.log('[08] cylId:', cylId)
  await snapshot('before-update')

  // Update diameter and height via open/close pattern
  await api.v1.part.openFeature({ id: cylId })
  const r = await api.v1.part.updateCylinder({ id: cylId, diameter: 100, height: 200 })
  console.log('[08] updateCylinder result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[08] updateCylinder msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'update-response')
  await api.v1.part.closeFeature({ id: cylId })

  await snapshot('after-update')
  return { partId, cylId }
}
