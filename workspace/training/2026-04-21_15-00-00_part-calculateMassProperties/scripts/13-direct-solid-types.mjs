export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SolidTypesTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result

  // Sphere: radius=20 => vol = (4/3)*π*20³ = 33510.32
  const sphId = (await api.v1.solid.sphere({ id: eifId, radius: 20 })).result
  const rSph = await api.v1.part.calculateMassProperties({ id: sphId })
  console.log('[13] sphere solid:', JSON.stringify(rSph.result))

  // Cylinder: d=24 (r=12), h=40 => vol = π*12²*40 = 18095.57
  const cylId = (await api.v1.solid.cylinder({ id: eifId, diameter: 24, height: 40, translation: [80, 0, 0] })).result
  const rCyl = await api.v1.part.calculateMassProperties({ id: cylId })
  console.log('[13] cylinder solid:', JSON.stringify(rCyl.result))

  // Box: 30x20x10 => vol = 6000
  const boxId = (await api.v1.solid.box({ id: eifId, length: 30, width: 20, height: 10, translation: [0, 80, 0] })).result
  const rBox = await api.v1.part.calculateMassProperties({ id: boxId })
  console.log('[13] box solid:', JSON.stringify(rBox.result))

  filewrite({
    sphere: { result: rSph.result, maxLevel: rSph.maxLevel },
    cylinder: { result: rCyl.result, maxLevel: rCyl.maxLevel },
    box: { result: rBox.result, maxLevel: rBox.maxLevel },
  }, 'solid-types')

  const expectedSphVol = (4 / 3) * Math.PI * Math.pow(20, 3)
  const expectedCylVol = Math.PI * 12 * 12 * 40
  console.log('[13] expected sph vol:', expectedSphVol.toFixed(2), 'cyl vol:', expectedCylVol.toFixed(2), 'box vol: 6000')

  // Part-level (sum of all three)
  const rAll = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[13] part total:', JSON.stringify(rAll.result))
  console.log('[13] expected total vol:', (expectedSphVol + expectedCylVol + 6000).toFixed(2))

  await snapshot('solid-types')
  return { partId }
}
