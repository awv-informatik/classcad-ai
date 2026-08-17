// Test whether copyFrom copies constraints from source to destination
// Rectangle auto-generates H/V constraints. Compare structure trees to see if they're copied.
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyConstraints' })).result

  // Source sketch: rectangle (auto-generates H/V constraints + fixation)
  const srcSkId = (await api.v1.sketch.create({ id: partId })).result
  const lines = (await api.v1.sketch.rectangle({ id: srcSkId, startPos: [0, 0, 0], endPos: [40, 30, 0] })).result
  console.log('[06] source rect lines:', lines)

  // Add an explicit HORIZONTAL constraint just to have more
  const hc = await api.v1.sketch.constraint({ id: srcSkId, type: 'FIXATION', geomId: lines[0] })
  console.log('[06] fixation constraint:', hc.result, 'maxLevel:', hc.maxLevel)

  // Get source structure
  const srcR = await api.v1.part.create({ name: 'dummy' }) // just to get a fresh structure... no

  // Actually, let's just look at the r.structure from the copyFrom call
  await snapshot('source')

  // Create destination and copy
  const dstSkId = (await api.v1.sketch.create({ id: partId })).result
  const r = await api.v1.sketch.copyFrom({ id: dstSkId, toCopyId: srcSkId })
  console.log('[06] copyFrom result:', r.result, 'maxLevel:', r.maxLevel)

  // Dump the structure from copyFrom response to inspect dest sketch contents
  filewrite(r.structure, 'structure-after-copy')

  await snapshot('dest-after-copy')

  return { partId }
}
