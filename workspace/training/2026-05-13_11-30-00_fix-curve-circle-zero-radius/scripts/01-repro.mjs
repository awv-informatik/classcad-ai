// Repro for TODO #1: curve.circle with radius <= 0 hangs server (100% CPU, kill -9).
// Expected (before fix): this script hangs at the first circle call — kill the harness.
// Expected (after fix):  the call returns a clean error message, maxLevel >= 51, no hang.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CirclePart' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  const shapeId = (await api.v1.curve.shape({ id: eifId, name: 'Circles' })).result
  console.log('[repro] setup done — partId=%s eifId=%s shapeId=%s', partId, eifId, shapeId)

  // Wrap each call in a timeout so a regression hang is visible but doesn't wedge the harness forever.
  const withTimeout = (p, ms, label) =>
    Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error(`timeout ${ms}ms: ${label}`)), ms)),
    ])

  const results = {}

  for (const radius of [0, -15]) {
    console.log(`[repro] calling circle with radius=${radius}...`)
    try {
      const r = await withTimeout(
        api.v1.curve.circle({ id: shapeId, centerPos: [0, 0, 0], radius }),
        10000,
        `radius=${radius}`,
      )
      console.log(`[repro] radius=${radius} returned. maxLevel=${r.maxLevel} messages=${JSON.stringify(r.messages)}`)
      results[`radius_${radius}`] = { result: r.result, maxLevel: r.maxLevel, messages: r.messages }
    } catch (e) {
      console.error(`[repro] radius=${radius} FAILED: ${e.message}`)
      results[`radius_${radius}`] = { error: e.message }
    }
  }

  filewrite(results, 'repro-results')
  return results
}
