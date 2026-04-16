// Copy with rotation + translation, rotateFirst=false
// Expected: translate first, then rotate around origin → orbits the origin
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotFalse' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 30, height: 20 })).result

  // rotateFirst=false:
  // 1) Translate [100, 0, 0] → box at X=100
  // 2) Rotate 90° Z around origin → box orbits to Y=100
  const c1 = (await api.v1.solid.copy({
    id: eifId, target: boxId,
    rotation: [0, 0, Math.PI / 2],
    translation: [100, 0, 0],
    rotateFirst: false
  })).result
  console.log('[05] copyId (rotateFirst=false):', c1)

  // Reference sphere at origin
  await api.v1.solid.sphere({ id: eifId, radius: 5 })

  await snapshot('rotate-first-false')

  filewrite({ boxId, copyId: c1, note: 'rotateFirst=false: translate then rotate (orbit)' }, 'info')
  return { partId, eifId, boxId, c1 }
}
