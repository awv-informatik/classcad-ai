// Study ID increment patterns for points
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'IdPattern' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const ids = []
  // Create 6 points, track ID increments
  for (let i = 0; i < 6; i++) {
    const r = await api.v1.sketch.point({ id: skId, pos: [i * 20, 0, 0], genFixation: false, genIncidence: false })
    ids.push(r.result)
    console.log('[16] point', i, 'id:', r.result)
  }

  // Compute deltas
  const deltas = []
  for (let i = 1; i < ids.length; i++) {
    deltas.push(ids[i] - ids[i-1])
  }
  console.log('[16] IDs:', ids.join(', '))
  console.log('[16] deltas:', deltas.join(', '))

  filewrite({ ids, deltas }, 'id-pattern')
  return { partId, skId }
}
