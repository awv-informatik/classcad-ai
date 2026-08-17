// Test: rotateFirst=false — translate first, then rotate around world origin
// This should cause the box to "orbit" around the origin
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotateFirstFalse' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Small reference box at origin
  const refId = (await api.v1.solid.box({ id: eifId, length: 15, width: 15, height: 15 })).result

  // rotateFirst=TRUE: rotate then translate
  // Box at origin → rotate 90° Z → translate [100, 0, 0] → ends up at [100, 0, 0] rotated
  const trueId = (await api.v1.solid.box({
    id: eifId, length: 60, width: 25, height: 20,
    rotation: [0, 0, Math.PI / 2],
    translation: [100, 0, 0],
    rotateFirst: true
  })).result
  console.log('[04] rotateFirst=true:', trueId)

  // rotateFirst=FALSE: translate then rotate
  // Box at origin → translate [100, 0, 0] → rotate 90° Z → the box orbits around origin
  // The [100,0,0] translation becomes [0,100,0] after 90° Z rotation
  const falseId = (await api.v1.solid.box({
    id: eifId, length: 60, width: 25, height: 20,
    rotation: [0, 0, Math.PI / 2],
    translation: [100, 0, 0],
    rotateFirst: false
  })).result
  console.log('[04] rotateFirst=false:', falseId)

  await snapshot('rotateFirst-comparison')
  return { partId, trueId, falseId }
}
