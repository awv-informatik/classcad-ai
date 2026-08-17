// Copy different solid types: sphere, cylinder, cone
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyShapes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 25, translation: [60, 0, 0] })).result
  const coneId = (await api.v1.solid.cone({ id: eifId, height: 35, bDiameter: 25, tDiameter: 5, translation: [120, 0, 0] })).result

  // Copy each with Y offset
  const sphCopy = (await api.v1.solid.copy({ id: eifId, target: sphId, translation: [0, 60, 0] })).result
  const cylCopy = (await api.v1.solid.copy({ id: eifId, target: cylId, translation: [0, 60, 0] })).result
  const coneCopy = (await api.v1.solid.copy({ id: eifId, target: coneId, translation: [0, 60, 0] })).result

  console.log('[06] sphere:', sphId, '→ copy:', sphCopy)
  console.log('[06] cylinder:', cylId, '→ copy:', cylCopy)
  console.log('[06] cone:', coneId, '→ copy:', coneCopy)

  filewrite({
    sphere: { original: sphId, copy: sphCopy },
    cylinder: { original: cylId, copy: cylCopy },
    cone: { original: coneId, copy: coneCopy }
  }, 'copy-ids')

  await snapshot('all-shapes-with-copies')
  return { partId, eifId }
}
