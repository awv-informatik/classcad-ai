/**
 * 07-tree-vs-fetch.mjs — cached tree() must equal a fresh server-side snapshot.
 *
 * Build a non-trivial tree, take a cached snapshot, then refresh and compare.
 * The two should be byte-for-byte identical (no drift).
 */

export default async function (api, { tree, filewrite }) {
  const partR = await api.v1.part.create({ name: 'P' })
  await api.v1.part.box({ id: partR.result, name: 'B1', length: 100, width: 100, height: 100 })
  await api.v1.part.cylinder({ id: partR.result, name: 'C1', radius: 25, length: 80 })

  const cached = await tree()
  const cachedJson = JSON.stringify(cached)

  const fresh = await tree({ refresh: true })
  const freshJson = JSON.stringify(fresh)

  filewrite(cached, 'cached')
  filewrite(fresh, 'fresh')

  const equal = cachedJson === freshJson
  console.log(`[07] cached length: ${cachedJson.length}`)
  console.log(`[07] fresh length:  ${freshJson.length}`)
  console.log(`[07] cached === fresh: ${equal ? '✓' : '❌'}`)

  if (!equal) {
    // Find first divergence for diagnostics.
    let i = 0
    while (i < Math.min(cachedJson.length, freshJson.length) && cachedJson[i] === freshJson[i]) i++
    console.log(`[07] first diff at char ${i}`)
    console.log(`[07] cached: ...${cachedJson.slice(Math.max(0, i - 30), i + 30)}...`)
    console.log(`[07] fresh:  ...${freshJson.slice(Math.max(0, i - 30), i + 30)}...`)
  }
}
