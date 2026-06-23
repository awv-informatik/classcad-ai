// Make the 3 holes via SEPARATE subtraction calls (vs one call), verify each succeeds
// and the box really has holes (volume drops), then offset. Proves whether offset
// handles genuine 3-hole topology — independent of the one-call nonmanifold failure.
export default async function (api, { filewrite }) {
  const withTimeout = (p, ms, label) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms))])
  const out = { steps: [] }

  const partId = (await api.v1.part.create({ name: 'RealHoles' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result

  const v0 = (await api.v1.part.calculateMassProperties({ id: boxId })).result?.volume
  out.steps.push({ step: 'box', volume: v0 })

  const positions = [[15, 15, -5], [45, 15, -5], [30, 30, -5]]
  for (let i = 0; i < positions.length; i++) {
    const cyl = (await api.v1.solid.cylinder({ id: eifId, height: 50, diameter: 10, translation: positions[i] })).result
    const r = await api.v1.solid.subtraction({ id: eifId, target: boxId, tools: [cyl] })
    const v = (await api.v1.part.calculateMassProperties({ id: boxId })).result?.volume
    out.steps.push({ step: `sub${i + 1}`, maxLevel: r.maxLevel, volume: v, msg: r.messages?.[0]?.message?.slice(0, 60) || '' })
    console.log(`sub${i + 1}: maxLevel=${r.maxLevel} volume=${v}`)
  }

  try {
    const r = await withTimeout(api.v1.solid.offset({ id: eifId, target: boxId, distance: 2 }), 15000, 'offset 3-hole')
    const v = (await api.v1.part.calculateMassProperties({ id: boxId })).result?.volume
    out.offset = { maxLevel: r.maxLevel, messages: r.messages, volumeAfter: v }
    console.log(`offset: maxLevel=${r.maxLevel} volumeAfter=${v} messages=${JSON.stringify(r.messages)}`)
  } catch (e) {
    out.offset = { error: e.message }
    console.error(`offset FAILED: ${e.message}`)
  }
  filewrite(out, 'realholes')
  return out
}
