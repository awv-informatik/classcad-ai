// Test combining rotation with translation — does order matter?
// rotation then translation vs translation then rotation
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RotTransTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box 1: rotate first, then translate
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 20, height: 15 })).result
  await api.v1.solid.rotation({ id: eifId, target: box1, rotation: [0, 0, Math.PI / 4] })
  await api.v1.solid.translation({ id: eifId, target: box1, translation: [0, 80, 0] })

  // Box 2: translate first, then rotate
  const box2 = (await api.v1.solid.box({ id: eifId, length: 80, width: 20, height: 15 })).result
  await api.v1.solid.translation({ id: eifId, target: box2, translation: [0, 80, 0] })
  await api.v1.solid.rotation({ id: eifId, target: box2, rotation: [0, 0, Math.PI / 4] })

  // Reference at origin
  const refId = (await api.v1.solid.sphere({ id: eifId, radius: 5 })).result

  await snapshot('rot-trans-vs-trans-rot')

  filewrite({ box1, box2 }, 'rot-trans-ids')
  return { box1, box2 }
}
