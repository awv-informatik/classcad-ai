// Test rotateFirst flag — controls transform order
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CylinderRotateFirst' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference: small box at origin for scale reference
  const boxId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10 })).result

  // rotateFirst=true (default): rotate around origin, then translate
  const cyl1 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 20,
    rotation: [0, 0, Math.PI / 4],
    translation: [60, 0, 0],
    rotateFirst: true
  })).result
  console.log('[04] cyl1 (rotateFirst=true):', cyl1)

  // rotateFirst=false: translate first, then rotate around origin
  const cyl2 = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 20,
    rotation: [0, 0, Math.PI / 4],
    translation: [60, 0, 0],
    rotateFirst: false
  })).result
  console.log('[04] cyl2 (rotateFirst=false):', cyl2)

  await snapshot('rotateFirst-comparison')
  return { partId, eifId, cyl1, cyl2, boxId }
}
