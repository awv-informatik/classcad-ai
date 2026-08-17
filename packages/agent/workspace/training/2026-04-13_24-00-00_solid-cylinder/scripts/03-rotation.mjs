// Cylinder with rotation — tilt around axes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylinderRotation' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Upright cylinder at origin
  const cyl1 = (await api.v1.solid.cylinder({ id: eifId, height: 80, diameter: 30 })).result
  console.log('[03] cyl1 (upright):', cyl1)

  // Rotated 90° around X (lies along Y-axis)
  const cyl2 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 30,
    rotation: [Math.PI / 2, 0, 0],
    translation: [80, 0, 0]
  })).result
  console.log('[03] cyl2 (rotated X 90°):', cyl2)

  // Rotated 45° around Z
  const cyl3 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 30,
    rotation: [0, 0, Math.PI / 4],
    translation: [0, 80, 0]
  })).result
  console.log('[03] cyl3 (rotated Z 45°):', cyl3)

  await snapshot('rotated-cylinders')
  return { partId, eifId, cyl1, cyl2, cyl3 }
}
