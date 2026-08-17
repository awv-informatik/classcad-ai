export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylNoOpen' })).result

  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 60, height: 80 })).result

  // Try updateCylinder WITHOUT openFeature — should fail
  const r = await api.v1.part.updateCylinder({ id: cylId, diameter: 120 })
  console.log('[11] no-open result:', r.result, 'maxLevel:', r.maxLevel)
  console.log('[11] no-open msgs:', JSON.stringify(r.messages))
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'no-open-response')

  return { partId, cylId }
}
