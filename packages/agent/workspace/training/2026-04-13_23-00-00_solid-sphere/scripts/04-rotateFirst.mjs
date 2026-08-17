// Test rotateFirst with sphere — since spheres are rotationally symmetric,
// rotateFirst should only matter for the internal representation.
// But let's verify the API accepts it cleanly.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SphereRotateFirst' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // rotateFirst=true (default) — rotate, then translate
  const r1 = await api.v1.solid.sphere({
    id: eifId, radius: 30,
    rotation: [0, 0, Math.PI / 4],
    translation: [80, 0, 0],
    rotateFirst: true
  })
  console.log('[04] rotateFirst=true:', r1.result, 'maxLevel:', r1.maxLevel)

  // rotateFirst=false — translate first, then rotate around origin
  const r2 = await api.v1.solid.sphere({
    id: eifId, radius: 30,
    rotation: [0, 0, Math.PI / 4],
    translation: [80, 0, 0],
    rotateFirst: false
  })
  console.log('[04] rotateFirst=false:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    rotateFirstTrue: r1.result,
    rotateFirstFalse: r2.result,
  }, 'rotateFirst-response')

  await snapshot('rotateFirst-comparison')

  return { partId, eifId }
}
