// Test rotation around each individual axis (X, Y, Z) separately
// π/2 = 90° on each axis individually
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AxisTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Non-symmetric box: length=80, width=40, height=20
  const boxX = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20, translation: [-60, 0, 0] })).result
  const boxY = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20, translation: [0, 0, 0] })).result
  const boxZ = (await api.v1.solid.box({ id: eifId, length: 80, width: 40, height: 20, translation: [60, 0, 0] })).result

  await snapshot('before-all-three')

  // Rotate X box by 90° around X
  const rX = await api.v1.solid.rotation({ id: eifId, target: boxX, rotation: [Math.PI / 2, 0, 0] })
  console.log('[02] rotateX result:', rX.result, 'maxLevel:', rX.maxLevel)

  // Rotate Y box by 90° around Y
  const rY = await api.v1.solid.rotation({ id: eifId, target: boxY, rotation: [0, Math.PI / 2, 0] })
  console.log('[02] rotateY result:', rY.result, 'maxLevel:', rY.maxLevel)

  // Rotate Z box by 90° around Z
  const rZ = await api.v1.solid.rotation({ id: eifId, target: boxZ, rotation: [0, 0, Math.PI / 2] })
  console.log('[02] rotateZ result:', rZ.result, 'maxLevel:', rZ.maxLevel)

  filewrite({
    rotateX: { result: rX.result, maxLevel: rX.maxLevel },
    rotateY: { result: rY.result, maxLevel: rY.maxLevel },
    rotateZ: { result: rZ.result, maxLevel: rZ.maxLevel },
  }, 'per-axis-results')

  await snapshot('after-each-axis-90deg')
  return { boxX, boxY, boxZ }
}
