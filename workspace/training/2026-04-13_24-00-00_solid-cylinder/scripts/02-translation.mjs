// Cylinder with translation — offset from origin
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylinderTranslation' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference cylinder at origin
  const cyl1 = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 30 })).result
  console.log('[02] cyl1 (origin):', cyl1)

  // Translated cylinder
  const cyl2 = (await api.v1.solid.cylinder({
    id: eifId, height: 60, diameter: 30,
    translation: [80, 40, 0]
  })).result
  console.log('[02] cyl2 (translated):', cyl2)

  await snapshot('two-cylinders')
  return { partId, eifId, cyl1, cyl2 }
}
