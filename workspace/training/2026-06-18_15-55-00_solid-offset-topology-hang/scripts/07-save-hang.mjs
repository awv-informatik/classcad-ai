// Confirm the REAL hang: STP export (common.save) after the one-call 3-cylinder
// subtraction fails (nonmanifold), leaving a corrupt/partial state. No offset involved.
export default async function (api, { filewrite }) {
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))])

  const partId = (await api.v1.part.create({ name: 'SaveHang' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const c1 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const c2 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const c3 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [30, 30, -5] })).result
  const sub = await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [c1, c2, c3] })
  console.log(`subtraction maxLevel=${sub.maxLevel} (expect 51 nonmanifold)`)

  const out = { subMaxLevel: sub.maxLevel }
  try {
    const r = await withTimeout(api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version: 2 } }), 15000, 'save STP')
    out.save = { maxLevel: r.maxLevel, messages: r.messages, ok: r.result?.success }
    console.log(`save STP -> maxLevel=${r.maxLevel} messages=${JSON.stringify(r.messages)?.slice(0,120)}`)
  } catch (e) {
    out.save = { error: e.message }
    console.error(`save STP FAILED: ${e.message}`)
  }
  filewrite(out, 'save-hang')
  return out
}
