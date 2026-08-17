// After the failed 3-tool subtraction, which entity's kernel is dangling/corrupt?
// Probe each with calculateMassProperties (touches the kernel brep) under a timeout.
export default async function (api, { filewrite }) {
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))])

  const partId = (await api.v1.part.create({ name: 'Dangling' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  const c1 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const c2 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const c3 = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: [30, 30, -5] })).result
  const sub = await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [c1, c2, c3] })
  console.log(`sub maxLevel=${sub.maxLevel}`)

  const out = { subMaxLevel: sub.maxLevel, probes: {} }
  for (const [name, id] of [['box', boxId], ['c1', c1], ['c2', c2], ['c3', c3]]) {
    try {
      const r = await withTimeout(api.v1.part.calculateMassProperties({ id }), 6000, `massprops ${name}`)
      out.probes[name] = { id, maxLevel: r.maxLevel, volume: r.result?.volume }
      console.log(`${name}(${id}): maxLevel=${r.maxLevel} volume=${r.result?.volume}`)
    } catch (e) {
      out.probes[name] = { id, error: e.message }
      console.error(`${name}(${id}): ${e.message}`)
      break // a hang wedges the worker; stop
    }
  }
  filewrite(out, 'which-dangling')
  return out
}
