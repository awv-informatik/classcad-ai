export default async function (api, { snapshot, filewrite }) {
  // Test: updateBoolean without openFeature — should fail
  const partId = (await api.v1.part.create({ name: 'NoOpen' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  const boolId = (await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [box2],
  })).result

  // Skip openFeature — try direct update
  const r = await api.v1.part.updateBoolean({
    id: boolId,
    type: 'SUBTRACTION',
  })

  console.log('[15] no openFeature — result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'no-open-response')

  return { partId }
}
