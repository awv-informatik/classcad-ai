// Test: rotation/translation/rotateFirst work the same on all primitive types
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CrossPrimitive' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const rot = [0, 0, Math.PI / 4]  // 45° Z
  const tr = [80, 0, 0]

  // Box — rotateFirst=true
  const boxT = (await api.v1.solid.box({
    id: eifId, length: 50, width: 30, height: 20,
    rotation: rot, translation: tr, rotateFirst: true
  })).result
  console.log('[06] box rotateFirst=true:', boxT)

  // Sphere — rotateFirst=true (rotation is visible because sphere has no visible orientation,
  // but the position should be the same as box rotateFirst=true)
  const sphT = (await api.v1.solid.sphere({
    id: eifId, radius: 15,
    rotation: rot, translation: tr, rotateFirst: true
  })).result
  console.log('[06] sphere rotateFirst=true:', sphT)

  // Cylinder — rotateFirst=false
  const cylF = (await api.v1.solid.cylinder({
    id: eifId, height: 40, diameter: 20,
    rotation: rot, translation: tr, rotateFirst: false
  })).result
  console.log('[06] cylinder rotateFirst=false:', cylF)

  // Cone — rotateFirst=false
  const coneF = (await api.v1.solid.cone({
    id: eifId, height: 40, bDiameter: 25, tDiameter: 5,
    rotation: rot, translation: [80, 80, 0], rotateFirst: false
  })).result
  console.log('[06] cone rotateFirst=false:', coneF)

  await snapshot('cross-primitive')
  return { partId }
}
