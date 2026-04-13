// Multiple cylinders in one EIF + deleteSolid
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylinderMulti' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const cyl1 = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 40 })).result
  const cyl2 = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 40, translation: [60, 0, 0] })).result
  const cyl3 = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 40, translation: [120, 0, 0] })).result
  console.log('[07] three cylinders:', cyl1, cyl2, cyl3)

  await snapshot('three-cylinders')

  // Delete middle one
  const delR = await api.v1.solid.deleteSolid({ id: eifId, ids: [cyl2] })
  console.log('[07] delete cyl2 — result:', delR.result, 'maxLevel:', delR.maxLevel)

  await snapshot('after-delete')
  return { partId, eifId, cyl1, cyl2, cyl3 }
}
