export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotateFirst' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Small reference box at origin
  const refBox = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20 })).result

  // rotateFirst=true (default): rotate then translate
  const box1 = (await api.v1.solid.box({
    id: eifId, length: 80, width: 30, height: 20,
    rotation: [0, 0, Math.PI / 4],
    translation: [100, 0, 0],
    rotateFirst: true
  })).result
  console.log('[04] rotateFirst=true:', box1)

  // rotateFirst=false: translate then rotate
  const box2 = (await api.v1.solid.box({
    id: eifId, length: 80, width: 30, height: 20,
    rotation: [0, 0, Math.PI / 4],
    translation: [100, 0, 0],
    rotateFirst: false
  })).result
  console.log('[04] rotateFirst=false:', box2)

  filewrite({ refBox, box1, box2 }, 'rotateFirst-ids')

  await snapshot('rotateFirst-comparison')
  return { partId }
}
