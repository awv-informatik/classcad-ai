// Test: deleting pattern constraint vs deleting pattern geometry
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DelPattern' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // Create a circle as source geometry
  const circ = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 10 })).result
  console.log('[08] source circle:', circ)

  // Create a linear pattern using rigidSetId (single geom auto-wraps)
  const pattern = await api.v1.sketch.linearPattern({
    id: skId,
    rigidSetId: circ,
    xCount: 3,
    xDistance: 30,
  })
  console.log('[08] pattern result:', JSON.stringify(pattern.result), 'maxLevel:', pattern.maxLevel)
  filewrite({ result: pattern.result, messages: pattern.messages, maxLevel: pattern.maxLevel }, 'pattern-response')

  await snapshot('before-delete')

  // Get geometry before
  const geomBefore = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[08] circles before:', geomBefore.result?.circles?.length)

  // Delete the pattern constraint (should remove copies but keep original)
  const r1 = await api.v1.sketch.deleteObject({ ids: [pattern.result.constraint] })
  console.log('[08] delete pattern constraint:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'delete-pattern-constraint')

  await snapshot('after-delete-pattern-constraint')

  const geomAfter = await api.v1.sketch.getGeometry({ id: skId })
  console.log('[08] circles after pattern constraint delete:', geomAfter.result?.circles?.length)
  filewrite(geomAfter.result, 'geom-after-pattern-delete')

  return { partId }
}
