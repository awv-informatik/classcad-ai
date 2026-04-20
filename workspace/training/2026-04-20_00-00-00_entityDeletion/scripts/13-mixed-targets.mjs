export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MixedTargets' })).result

  // Create a standalone cylinder
  const cyl = (await api.v1.part.cylinder({
    id: partId, name: 'Cyl1', height: 40, diameter: 20
  })).result

  // Create a box + pattern
  const wcs = (await api.v1.part.workCSys({
    id: partId, name: 'WCS1',
    origin: [60, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  const box = (await api.v1.part.box({
    id: partId, name: 'Box1', length: 15, width: 15, height: 15, references: [wcs]
  })).result
  const wa = (await api.v1.part.workAxis({ id: partId, name: 'WA1', origin: [60, 0, 0], direction: [0, 1, 0] })).result

  const pattern = (await api.v1.part.linearPattern({
    id: partId, name: 'LP1',
    targets: [box],
    dir1: { references: [wa], distance: 30, count: 4 }
  })).result
  console.log('[13] cyl:', cyl, 'box:', box, 'pattern:', pattern)

  await snapshot('before-mixed')

  // Delete cylinder (plain ID) AND pattern indices [1, 2] in one call
  const r = await api.v1.part.entityDeletion({
    id: partId, name: 'DelMixed',
    targets: [cyl, { id: pattern, indices: [1, 2] }]
  })
  console.log('[13] mixed deletion result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'mixed-deletion-response')

  await snapshot('after-mixed-deletion')

  return { partId }
}
