// Test scaling different solid types: sphere, cylinder, cone
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ScaleTypesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 20, translation: [60, 0, 0] })).result
  const coneId = (await api.v1.solid.cone({ id: eifId, height: 30, bDiameter: 25, tDiameter: 5, translation: [120, 0, 0] })).result
  // Reference
  const refId = (await api.v1.solid.box({ id: eifId, length: 10, width: 10, height: 10, translation: [0, 80, 0] })).result

  await snapshot('before-type-scale')

  // Scale each by 2
  const r1 = await api.v1.solid.scale({ id: eifId, target: sphId, factor: 2 })
  console.log('[14] sphere scale result:', r1.result, 'maxLevel:', r1.maxLevel)

  const r2 = await api.v1.solid.scale({ id: eifId, target: cylId, factor: 2 })
  console.log('[14] cylinder scale result:', r2.result, 'maxLevel:', r2.maxLevel)

  const r3 = await api.v1.solid.scale({ id: eifId, target: coneId, factor: 2 })
  console.log('[14] cone scale result:', r3.result, 'maxLevel:', r3.maxLevel)

  filewrite({
    sphere: { result: r1.result, maxLevel: r1.maxLevel },
    cylinder: { result: r2.result, maxLevel: r2.maxLevel },
    cone: { result: r3.result, maxLevel: r3.maxLevel },
  }, 'type-scale-responses')

  await snapshot('after-type-scale')

  return { partId, eifId, sphId, cylId, coneId }
}
