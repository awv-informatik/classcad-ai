// Narrow the snapshot-before-offset trigger to the exact call.
//   CC_TEST=settings -> only setDatabaseSettings(graphics on), then offset
//   CC_TEST=recalc   -> setDatabaseSettings + common.recalc, then offset
//   CC_TEST=recalc_only -> common.recalc (default settings), then offset
export default async function (api, { filewrite }) {
  const which = process.env.CC_TEST || 'recalc'
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))])

  const partId = (await api.v1.part.create({ name: 'OffsetTrig' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const c1 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const c2 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const c3 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [30, 30, -5] })).result
  await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [c1, c2, c3] })

  if (which === 'settings' || which === 'recalc') {
    await api.v1.common.setDatabaseSettings({ isGraphicEnabled: true, isCCGraphicEnabled: true, isSketchGraphicEnabled: true, doCurveTessellation: true })
    console.log(`[${which}] setDatabaseSettings(graphics on) done`)
  }
  if (which === 'recalc' || which === 'recalc_only') {
    const rc = await withTimeout(api.v1.common.recalc({}), 15000, 'recalc')
    console.log(`[${which}] recalc done, maxLevel=${rc.maxLevel}`)
  }

  const out = {}
  try {
    const r = await withTimeout(api.v1.solid.offset({ id: eifId, target: boxId, distance: 2 }), 15000, `offset ${which}`)
    out.offset = { result: r.result, maxLevel: r.maxLevel, messages: r.messages }
    console.log(`[${which}] offset -> maxLevel=${r.maxLevel} messages=${JSON.stringify(r.messages)}`)
  } catch (e) {
    out.offset = { error: e.message }
    console.error(`[${which}] FAILED: ${e.message}`)
  }
  filewrite(out, `trigger-${which}`)
  return out
}
