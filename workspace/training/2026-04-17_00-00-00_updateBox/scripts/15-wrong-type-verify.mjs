export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 30, height: 60 })).result
  console.log('[15] cylId:', cylId)

  await snapshot('before')

  // Try updateBox on cylinder with all box params
  await api.v1.part.openFeature({ id: cylId })
  const upR = await api.v1.part.updateBox({ id: cylId, length: 100, width: 80, height: 200, name: 'BoxName?' })
  console.log('[15] updateBox on cyl — result:', upR.result, 'maxLevel:', upR.maxLevel)
  filewrite({ result: upR.result, messages: upR.messages, maxLevel: upR.maxLevel }, 'wrong-type-full-response')
  await api.v1.part.closeFeature({ id: cylId })

  await snapshot('after')

  // Check what the cylinder looks like now — did it actually change?
  // Also try updateCylinder after updateBox to see if cylinder is still a cylinder
  await api.v1.part.openFeature({ id: cylId })
  const cylUpR = await api.v1.part.updateCylinder({ id: cylId, radius: 50 })
  console.log('[15] updateCylinder after updateBox — result:', cylUpR.result, 'maxLevel:', cylUpR.maxLevel)
  filewrite({ result: cylUpR.result, messages: cylUpR.messages, maxLevel: cylUpR.maxLevel }, 'cyl-update-after-response')
  await api.v1.part.closeFeature({ id: cylId })

  await snapshot('after-cyl-update')

  return { partId, cylId }
}
