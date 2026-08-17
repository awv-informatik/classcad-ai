// Test: rotation order — docs say Z first, then Y, then X
// We'll use a non-symmetric box and apply compound rotations to verify order
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotationOrder' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference: no rotation
  const ref = (await api.v1.solid.box({
    id: eifId, length: 100, width: 30, height: 15,
  })).result
  console.log('[05] ref:', ref)

  // Rotation [π/2, 0, 0] — 90° around X. Should tilt width into Z
  const rx90 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 30, height: 15,
    rotation: [Math.PI / 2, 0, 0],
    translation: [0, 80, 0]
  })).result
  console.log('[05] rx90:', rx90)

  // Rotation [0, π/2, 0] — 90° around Y. Should swap length/height
  const ry90 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 30, height: 15,
    rotation: [0, Math.PI / 2, 0],
    translation: [0, 0, 80]
  })).result
  console.log('[05] ry90:', ry90)

  // Rotation [0, 0, π/2] — 90° around Z. Should swap length/width
  const rz90 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 30, height: 15,
    rotation: [0, 0, Math.PI / 2],
    translation: [80, 0, 0]
  })).result
  console.log('[05] rz90:', rz90)

  // Compound: [π/4, π/4, 0] — test interaction of X and Y rotations
  const rxry = (await api.v1.solid.box({
    id: eifId, length: 100, width: 30, height: 15,
    rotation: [Math.PI / 4, Math.PI / 4, 0],
    translation: [80, 80, 0]
  })).result
  console.log('[05] rxry:', rxry)

  await snapshot('rotation-order')
  return { partId }
}
