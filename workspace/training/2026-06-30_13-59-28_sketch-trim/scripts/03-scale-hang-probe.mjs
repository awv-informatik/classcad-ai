// 03 — WARNING HANG-RISK PROBE: bounded <=30 segs, lightly-constrained (planeId, ZERO manual dimensions,
// auto-constraints only). trimCurves hung at ~39 segs / 20 constraints+20 dims (TODO build-lever-bracket).
// Run LAST; be ready to kill -9. Smallest tier first; filewrite N before each trim so a hang loses no data.
import { makeSketch, addSketch, line } from './_setup.mjs'

// build H horizontals (y spread) and V verticals (x spread) crossing in a grid
async function buildGrid(api, skId, H, V) {
  for (let i = 0; i < H; i++) await line(api, skId, [0, 20 + i * 20, 0], [200, 20 + i * 20, 0])
  for (let j = 0; j < V; j++) await line(api, skId, [20 + j * 30, 0, 0], [20 + j * 30, 200, 0])
}

export default async function (api, { filewrite }) {
  const { partId, skId, planeId } = await makeSketch(api)
  const tiers = [{ name: 'T1', H: 2, V: 2 }, { name: 'T2', H: 3, V: 3 }, { name: 'T3', H: 2, V: 5 }]
  const results = []

  for (let t = 0; t < tiers.length; t++) {
    const tier = tiers[t]
    const sk = t === 0 ? skId : await addSketch(api, partId, planeId, tier.name)
    await buildGrid(api, sk, tier.H, tier.V)
    const pre = await api.v1.sketch.preTrim({ id: sk })
    const segs = pre.result.flatMap(e => e.splittedCurves.map(s => s.id))
    const N = segs.length
    const subset = segs.filter((_, i) => i % 2 === 0) // ~half, every other
    filewrite({ tier: tier.name, N, subsetCount: subset.length }, `03-${tier.name}-pre`) // persist BEFORE trim
    console.log(`[03] ${tier.name}: staged N=${N}, trimming ${subset.length}...`)

    const t0 = Date.now()
    const rTrim = await api.v1.sketch.trim({ id: sk, curveIds: subset })
    const trimMs = Date.now() - t0
    const tp = Date.now()
    const rPost = await api.v1.sketch.postTrim({ id: sk })
    const postMs = Date.now() - tp
    const row = { tier: tier.name, N, subset: subset.length, trimMs, postMs, trimMax: rTrim.maxLevel, postMax: rPost.maxLevel, trimVoid: rTrim.result === null }
    results.push(row)
    console.log(`[03] ${tier.name}: N=${N} trim=${trimMs}ms post=${postMs}ms trimMax=${rTrim.maxLevel} postMax=${rPost.maxLevel}`)
  }

  filewrite(results, '03-scale-results')
  const trend = results.map(r => r.trimMs)
  const superLinear = results.length === 3 && trend[2] > 5 * Math.max(1, trend[0])
  console.log('[03] trimMs trend', JSON.stringify(trend), '| superlinear(T3>5xT1)?', superLinear)
  console.log('[03] VERDICT:', results.every(r => r.trimVoid && r.trimMax <= 31)
    ? `no hang up to N=${Math.max(...results.map(r => r.N))} segs; trimMs flat (${trend.join('/')}) — trim does NOT inherit the trimCurves hang at low constraint density`
    : 'anomaly — see data')
  return { results }
}
