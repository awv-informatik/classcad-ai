export default async function (api, { snapshot, filewrite }) {
  // Clean test: does tools as [{ id }] actually work?
  // Use fresh boxes for each test, no reuse.
  const partId = (await api.v1.part.create({ name: 'CleanObjForm' })).result

  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const cyl1 = (await api.v1.part.cylinder({ id: partId, name: 'Cyl', diameter: 20, height: 60, translation: [30, 30, -5] })).result

  console.log('[07] partId:', partId, 'box1:', box1, 'cyl1:', cyl1)

  // Test: tools as object [{ id: cyl1 }] — fresh, nothing consumed yet
  const r = await api.v1.part.boolean({
    id: partId,
    type: 'SUBTRACTION',
    target: box1,
    tools: [{ id: cyl1 }],
  })
  console.log('[07] tools=[{id}] — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'clean-obj-response')

  if (r.maxLevel <= 31) {
    await snapshot('result')
  }

  return { partId }
}
