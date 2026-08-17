// Copy with rotation + translation, rotateFirst=true (default)
// Expected: rotate around origin first, then translate to position
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotFirst' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Non-symmetric box so rotation is visible
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 30, height: 20 })).result

  // Copy with rotation 90° Z + translation. rotateFirst=true (default):
  // 1) Rotate the box 90° around Z at origin → box extends in +Y instead of +X
  // 2) Translate [100, 0, 0] → move the rotated box to X=100
  const c1 = (await api.v1.solid.copy({
    id: eifId, target: boxId,
    rotation: [0, 0, Math.PI / 2],
    translation: [100, 0, 0]
    // rotateFirst defaults to TRUE
  })).result
  console.log('[04] copyId (rotateFirst=true):', c1)

  // Also add a small reference sphere at origin for orientation
  await api.v1.solid.sphere({ id: eifId, radius: 5 })

  await snapshot('rotate-first-true')

  filewrite({ boxId, copyId: c1, note: 'rotateFirst=true: rotate then translate' }, 'info')
  return { partId, eifId, boxId, c1 }
}
