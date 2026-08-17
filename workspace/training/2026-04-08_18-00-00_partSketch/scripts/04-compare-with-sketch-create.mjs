// 04 — Compare part.sketch vs sketch.create side by side
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Create via part.sketch
  const r1 = await api.v1.part.sketch({ id: partId, name: 'ViaPartSketch' })
  console.log('[04] part.sketch result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Create via sketch.create
  const r2 = await api.v1.sketch.create({ id: partId, name: 'ViaSketchCreate' })
  console.log('[04] sketch.create result:', r2.result, 'maxLevel:', r2.maxLevel)

  // Compare envelope keys
  const keys1 = Object.keys(r1).sort()
  const keys2 = Object.keys(r2).sort()
  console.log('[04] part.sketch keys:', keys1.join(','))
  console.log('[04] sketch.create keys:', keys2.join(','))
  console.log('[04] same keys?', keys1.join(',') === keys2.join(','))

  // Both should have created 3 objects each — check structure
  filewrite(r2.structure, 'structure-both-sketches')

  await snapshot('both-sketches')
  return { partId, partSketchId: r1.result, sketchCreateId: r2.result }
}
