// Test: rotation parameter — what axis order? Rotation around world origin or local?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotationTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Reference box at origin (no rotation)
  const ref = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20 })).result
  console.log('[02] ref (no rotation):', ref)

  // Rotate 45° around Z axis — should tilt in XY plane
  const rz = (await api.v1.solid.box({
    id: eifId, length: 80, width: 40, height: 20,
    rotation: [0, 0, Math.PI / 4],
    translation: [0, 100, 0]  // offset to separate visually
  })).result
  console.log('[02] rz (45° Z):', rz)

  // Rotate 45° around X axis
  const rx = (await api.v1.solid.box({
    id: eifId, length: 80, width: 40, height: 20,
    rotation: [Math.PI / 4, 0, 0],
    translation: [0, 0, 100]
  })).result
  console.log('[02] rx (45° X):', rx)

  // Rotate 45° around Y axis
  const ry = (await api.v1.solid.box({
    id: eifId, length: 80, width: 40, height: 20,
    rotation: [0, Math.PI / 4, 0],
    translation: [100, 0, 0]
  })).result
  console.log('[02] ry (45° Y):', ry)

  await snapshot('rotation-boxes')
  return { partId, ref, rz, rx, ry }
}
