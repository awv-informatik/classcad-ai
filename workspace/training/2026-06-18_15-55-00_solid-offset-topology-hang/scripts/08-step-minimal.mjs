// Minimal trigger for the STEP-export hang. solid.box is CENTERED (x[-30,30] y[-20,20] z[-15,15]).
//   CC_TEST=cleanbox   -> box only, save STP            (expect OK)
//   CC_TEST=onehole    -> box - cyl@[15,15] (valid), save STP   (expect OK)
//   CC_TEST=tangentsub -> box - cyl@[45,15] (outside/tangent; sub fails), save STP  (hang?)
//   CC_TEST=recalcafter-> box - cyl@[45,15] (fails), recalc (not save)  (hang? expect OK)
export default async function (api, { filewrite }) {
  const which = process.env.CC_TEST || 'tangentsub'
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))])

  const partId = (await api.v1.part.create({ name: 'StepMin' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const out = { which }

  if (which !== 'cleanbox') {
    const pos = (which === 'onehole') ? [15, 15, -5] : [45, 15, -5]
    const cyl = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: pos })).result
    const sub = await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cyl] })
    out.subMaxLevel = sub.maxLevel
    console.log(`[${which}] sub maxLevel=${sub.maxLevel}`)
  }

  try {
    if (which === 'recalcafter') {
      const r = await withTimeout(api.v1.common.recalc({}), 12000, 'recalc')
      out.op = { kind: 'recalc', maxLevel: r.maxLevel }
      console.log(`[${which}] recalc maxLevel=${r.maxLevel}`)
    } else {
      const r = await withTimeout(api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version: 2 } }), 12000, 'save STP')
      out.op = { kind: 'save', maxLevel: r.maxLevel, ok: r.result?.success, messages: r.messages }
      console.log(`[${which}] save STP maxLevel=${r.maxLevel} ok=${r.result?.success}`)
    }
  } catch (e) {
    out.op = { error: e.message }
    console.error(`[${which}] FAILED: ${e.message}`)
  }
  filewrite(out, `step-${which}`)
  return out
}
