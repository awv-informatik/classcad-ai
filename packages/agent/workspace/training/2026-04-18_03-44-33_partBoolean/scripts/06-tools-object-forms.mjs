export default async function (api, { snapshot, filewrite }) {
  // Test various tools formats carefully with message capture
  const partId = (await api.v1.part.create({ name: 'ToolsForms' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const cyl1 = (await api.v1.part.cylinder({ id: partId, name: 'Tool1', diameter: 30, height: 60, translation: [30, 30, 0] })).result
  const cyl2 = (await api.v1.part.cylinder({ id: partId, name: 'Tool2', diameter: 20, height: 50, translation: [60, 20, 0] })).result

  console.log('[06] partId:', partId, 'box1:', box1, 'cyl1:', cyl1, 'cyl2:', cyl2)

  // Test 1: tools as plain IDs (should work)
  const r1 = await api.v1.part.boolean({
    id: partId,
    type: 'SUBTRACTION',
    target: box1,
    tools: [cyl1],
  })
  console.log('[06] plain tools — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'plain-tools')

  await snapshot('subtracted')

  // Test 2: second boolean with tools as object form [{ id: ... }]
  const r2 = await api.v1.part.boolean({
    id: partId,
    type: 'SUBTRACTION',
    target: box1,
    tools: [{ id: cyl2 }],
  })
  console.log('[06] object tools — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'object-tools')

  return { partId }
}
