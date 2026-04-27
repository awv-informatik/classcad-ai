export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IdTest' })).result

  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 20, height: 40 })).result
  console.log('[06] partId:', partId, 'boxId:', boxId, 'cylId:', cylId)

  // Test with part ID
  const rPart = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[06] part result:', JSON.stringify(rPart.result))
  console.log('[06] part maxLevel:', rPart.maxLevel)

  // Test with feature ID (box)
  const rBox = await api.v1.part.calculateMassProperties({ id: boxId })
  console.log('[06] box feature result:', JSON.stringify(rBox.result))
  console.log('[06] box maxLevel:', rBox.maxLevel)

  // Test with feature ID (cylinder)
  const rCyl = await api.v1.part.calculateMassProperties({ id: cylId })
  console.log('[06] cyl feature result:', JSON.stringify(rCyl.result))
  console.log('[06] cyl maxLevel:', rCyl.maxLevel)

  filewrite({
    part: { result: rPart.result, maxLevel: rPart.maxLevel, messages: rPart.messages },
    boxFeature: { result: rBox.result, maxLevel: rBox.maxLevel, messages: rBox.messages },
    cylFeature: { result: rCyl.result, maxLevel: rCyl.maxLevel, messages: rCyl.messages },
  }, 'id-types')

  // Box volume = 72000, Cyl volume = π*10²*40 = 12566.37
  // Part volume should be sum = 84566.37
  const boxVol = 60 * 40 * 30
  const cylVol = Math.PI * 10 * 10 * 40
  console.log('[06] expected boxVol:', boxVol, 'cylVol:', cylVol.toFixed(2), 'total:', (boxVol + cylVol).toFixed(2))

  await snapshot('id-types')
  return { partId, boxId, cylId }
}
