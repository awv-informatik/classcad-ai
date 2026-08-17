// Test getSketch for a sketch on a non-default work plane
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create a custom work plane
  const wpId = (await api.v1.part.workPlane({
    id: partId, name: 'CustomWP', origin: [0, 0, 100], normal: [0, 0, 1], xDirection: [1, 0, 0],
  })).result

  // Create sketch on that work plane
  const skId = (await api.v1.part.sketch({ id: partId, planeId: wpId, name: 'OnCustomWP' })).result
  console.log('[10] sketch on custom WP, id:', skId)

  // Look it up
  const r = await api.v1.part.getSketch({ id: partId, name: 'OnCustomWP' })
  console.log('[10] found:', r.result, 'match:', r.result === skId, 'maxLevel:', r.maxLevel)

  filewrite({ created: skId, found: r.result, match: r.result === skId, maxLevel: r.maxLevel }, 'workplane-response')

  return { partId }
}
