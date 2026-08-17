export default async function (api, { snapshot, filewrite }) {
  // Verify: are target and tool features consumed after boolean?
  const partId = (await api.v1.part.create({ name: 'Consumption' })).result
  const box1 = (await api.v1.part.box({ id: partId, name: 'Base', length: 80, width: 60, height: 40 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Tool', length: 40, width: 30, height: 60, translation: [50, 20, 0] })).result

  const boolId = (await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [box2],
  })).result

  console.log('[08] boolId:', boolId)

  // Try to use box1 (target) as target for another boolean
  const box3 = (await api.v1.part.box({ id: partId, name: 'Extra', length: 30, width: 30, height: 30, translation: [0, 0, 40] })).result
  const r1 = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box1,
    tools: [box3],
  })
  console.log('[08] reuse consumed target — result:', r1.result, 'maxLevel:', r1.maxLevel)
  filewrite({ result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }, 'reuse-target')

  // Try to use box2 (tool) as target
  const box4 = (await api.v1.part.box({ id: partId, name: 'Extra2', length: 20, width: 20, height: 20, translation: [0, 60, 0] })).result
  const r2 = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: box2,
    tools: [box4],
  })
  console.log('[08] reuse consumed tool — result:', r2.result, 'maxLevel:', r2.maxLevel)
  filewrite({ result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }, 'reuse-tool')

  // Use the boolean feature ID as target for chaining — should this work?
  const box5 = (await api.v1.part.box({ id: partId, name: 'Extra3', length: 25, width: 25, height: 25, translation: [0, 0, 40] })).result
  const r3 = await api.v1.part.boolean({
    id: partId,
    type: 'UNION',
    target: boolId,
    tools: [box5],
  })
  console.log('[08] chain via boolId — result:', r3.result, 'maxLevel:', r3.maxLevel)
  filewrite({ result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }, 'chain-bool')

  if (r3.maxLevel <= 31) {
    await snapshot('chained')
  }

  return { partId }
}
