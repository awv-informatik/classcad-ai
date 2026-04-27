export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BatchTest' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 40, width: 30, height: 20, translation: [80, 0, 0] })).result
  const cyl1 = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', diameter: 30, height: 40, translation: [0, 80, 0] })).result

  console.log('[05] box1:', box1, 'box2:', box2, 'cyl1:', cyl1)

  // Batch: set different colors on multiple features at once
  const r1 = await api.v1.part.setAppearance([
    { target: box1, color: [255, 0, 0], transparency: 0.2 },
    { target: box2, color: [0, 255, 0], transparency: 0.5 },
    { target: cyl1, color: [0, 0, 255] },
  ])
  console.log('[05] batch result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, messages: r1.messages, maxLevel: r1.maxLevel }, 'batch-result')

  await snapshot('batch-colored')

  // Batch mixing plain ID and { id, indices } form
  const r2 = await api.v1.part.setAppearance([
    { target: box1, color: [128, 128, 0] },
    { target: { id: box2, indices: [0] }, color: [128, 0, 128] },
  ])
  console.log('[05] mixed batch:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, messages: r2.messages, maxLevel: r2.maxLevel }, 'mixed-batch-result')

  await snapshot('mixed-batch')
  return { partId }
}
