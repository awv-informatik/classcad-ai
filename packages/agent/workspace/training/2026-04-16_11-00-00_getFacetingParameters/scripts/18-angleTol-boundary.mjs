// Test: what angleTol values are accepted? Fractional vs integer
export default async function (api, { filewrite }) {
  const results = []

  for (const val of [0, 0.1, 0.5, 0.9, 1, 1.5, 2, 3, 5, 10, 15, 20, 45, 90, 180, 360]) {
    const r = await api.v1.common.setFacetingParameters({ angleTol: val, chordHeightTol: 0.1 })
    const readback = (await api.v1.common.getFacetingParameters()).result
    console.log(`[18] angleTol=${val}: maxLevel=${r.maxLevel}, readback=${readback.angleTol}`)
    results.push({ input: val, maxLevel: r.maxLevel, readback: readback.angleTol })
  }

  filewrite(results, 'angleTol-boundary')
  return results
}
