// Test: deleting the SOURCE geometry of a pattern — what happens to copies?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelPatternSrc' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  const circ = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 10 })).result

  const pattern = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: circ,
    xCount: 3,
    xDistance: 30,
  })
  console.log('[09] pattern:', JSON.stringify(pattern.result))

  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[09] circles before:', geomBefore.result?.circles?.length)

  await snapshot('before-delete-source')

  // Delete the source circle (the original)
  const r = await api.v1.sketch.deleteObject({ ids: [circ] })
  console.log('[09] delete source circle:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'delete-source-response')

  await snapshot('after-delete-source')

  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[09] circles after source delete:', geomAfter.result?.circles?.length)
  filewrite(geomAfter.result, 'geom-after-source-delete')

  return { partId }
}
