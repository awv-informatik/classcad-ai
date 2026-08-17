// Test: is setDatabaseSettings alone the cause, or is it the save operations?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SetDBTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Test A: setDatabaseSettings(graphic=true) -> translate
  const sA = (await api.v1.curve.shape({ id: eifId, name: 'GfxOn' })).result
  await api.v1.curve.line({ id: sA, startPos: [0, 0, 0], endPos: [10, 0, 0] })
  await api.v1.common.setDatabaseSettings({ isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true })
  const rA = await api.v1.curve.translateShape({ id: sA, translation: [10, 0, 0] })
  console.log('[16] A setDB gfx-on:', rA.maxLevel)

  // Test B: save STP -> translate
  const sB = (await api.v1.curve.shape({ id: eifId, name: 'SaveSTP' })).result
  await api.v1.curve.line({ id: sB, startPos: [0, 20, 0], endPos: [10, 20, 0] })
  await api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version: 2 } })
  const rB = await api.v1.curve.translateShape({ id: sB, translation: [10, 0, 0] })
  console.log('[16] B save-STP:', rB.maxLevel)

  // Test C: save OFB -> translate
  const sC = (await api.v1.curve.shape({ id: eifId, name: 'SaveOFB' })).result
  await api.v1.curve.line({ id: sC, startPos: [0, 40, 0], endPos: [10, 40, 0] })
  await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const rC = await api.v1.curve.translateShape({ id: sC, translation: [10, 0, 0] })
  console.log('[16] C save-OFB:', rC.maxLevel)

  // Test D: no setDB, no save -> translate (control)
  const sD = (await api.v1.curve.shape({ id: eifId, name: 'Control' })).result
  await api.v1.curve.line({ id: sD, startPos: [0, 60, 0], endPos: [10, 60, 0] })
  const rD = await api.v1.curve.translateShape({ id: sD, translation: [10, 0, 0] })
  console.log('[16] D control:', rD.maxLevel)

  filewrite({
    setDBGfx: rA.maxLevel,
    saveSTP: rB.maxLevel,
    saveOFB: rC.maxLevel,
    control: rD.maxLevel,
  }, 'setdb-results')

  return { partId }
}
