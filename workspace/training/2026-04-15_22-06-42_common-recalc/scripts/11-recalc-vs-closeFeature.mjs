// Test whether recalc is needed after closeFeature — prior training says no
// Also test whether recalc after openFeature+updateBox (without close) does anything
export default async function (api, { filewrite, snapshot }) {
  const partId = (await api.v1.part.create({ name: 'CloseFeatTest' })).result

  // Create parametric box
  const boxId = (await api.v1.part.box({ id: partId, length: 60, width: 40, height: 30 })).result
  console.log('[11] boxId:', boxId)

  // openFeature → updateBox → recalc (WITHOUT closeFeature first)
  await api.v1.part.openFeature({ id: boxId })
  const upd = await api.v1.part.updateBox({ id: boxId, length: 120 })
  console.log('[11] updateBox result:', upd.result, 'maxLevel:', upd.maxLevel)

  // Try recalc while feature is open
  const r1 = await api.v1.common.recalc()
  console.log('[11] recalc while open: result:', r1.result, 'maxLevel:', r1.maxLevel)
  console.log('[11] recalc while open messages:', JSON.stringify(r1.messages))

  // Now close
  const close = await api.v1.part.closeFeature({ id: boxId })
  console.log('[11] closeFeature result:', close.result, 'maxLevel:', close.maxLevel)

  // Recalc after close — should be redundant
  const r2 = await api.v1.common.recalc()
  console.log('[11] recalc after close: result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('final')

  filewrite({
    updateBox: { result: upd.result, maxLevel: upd.maxLevel },
    recalcWhileOpen: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    closeFeature: { result: close.result, maxLevel: close.maxLevel },
    recalcAfterClose: { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  }, 'close-vs-recalc')

  return { boxId }
}
