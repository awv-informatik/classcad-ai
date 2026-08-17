// Test: rotation center — does rotation happen around world origin or local solid center?
// Box starts at (0,0,0) corner-aligned. If we rotate it 90° around Z:
// - Around world origin: the box pivots around (0,0,0), its corner stays at origin
// - Around local center: the box pivots around its center point
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotationCenter' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Small marker at origin
  const marker = (await api.v1.solid.sphere({ id: eifId, radius: 5 })).result

  // Unrotated box — extends from (0,0,0) in +X, +Y, +Z
  const ref = (await api.v1.solid.box({
    id: eifId, length: 80, width: 30, height: 20,
    translation: [0, 0, 40]  // lift it up so we can see the marker
  })).result
  console.log('[08] ref:', ref)

  // Same box rotated 90° around Z — if pivot is at origin (corner),
  // the length axis swings from +X to +Y
  const rotated = (await api.v1.solid.box({
    id: eifId, length: 80, width: 30, height: 20,
    rotation: [0, 0, Math.PI / 2],
    translation: [0, 0, 80]  // lift more to separate visually
  })).result
  console.log('[08] rotated 90° Z:', rotated)

  await snapshot('rotation-center')
  return { partId }
}
