// Test: rotateFirst=true (default) — rotate around origin first, then translate
// The box should end up at the translated position with the rotation applied
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotateFirstTrue' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Small reference box at origin
  const refId = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20 })).result

  // rotateFirst=true (default): rotate 90° around Z, then translate to [100, 0, 0]
  // Box is at origin → rotated 90° Z (stays at origin, just rotated) → translated to [100, 0, 0]
  const rf1 = (await api.v1.solid.box({
    id: eifId, length: 80, width: 30, height: 20,
    rotation: [0, 0, Math.PI / 2],
    translation: [100, 0, 0],
    rotateFirst: true
  })).result
  console.log('[03] rotateFirst=true box:', rf1)

  // Explicit rotateFirst=true should match default behavior
  const rf2 = (await api.v1.solid.box({
    id: eifId, length: 80, width: 30, height: 20,
    rotation: [0, 0, Math.PI / 2],
    translation: [100, 0, 60]
  })).result
  console.log('[03] default (no rotateFirst):', rf2)

  await snapshot('rotateFirst-true')

  // Dump positions to verify the two boxes are in the same location
  filewrite({ refId, rf1, rf2, note: 'rf1 (explicit true) and rf2 (default) should be identical' }, 'ids')
  return { partId }
}
