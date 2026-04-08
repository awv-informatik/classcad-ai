// Test getSketch with special characters in sketch name
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const names = ['Sketch/Front', 'Sketch (Top)', 'Sketch_v2.1', 'Sketch-Left', '  Sketch  ']
  const results = []

  for (const name of names) {
    const skId = (await api.v1.part.sketch({ id: partId, name })).result
    const r = await api.v1.part.getSketch({ id: partId, name })
    const match = r.result === skId
    console.log(`[13] name="${name}" created=${skId} found=${r.result} match=${match}`)
    results.push({ name, created: skId, found: r.result, match })
  }

  filewrite(results, 'special-chars-response')

  return { partId }
}
