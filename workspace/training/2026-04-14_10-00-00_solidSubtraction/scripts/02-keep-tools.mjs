// Test keepTools: true — tool should remain valid after subtraction
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SubKeepTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 80, height: 60
  })).result

  const cyl = (await api.v1.solid.cylinder({
    id: eifId, height: 80, diameter: 30,
    translation: [40, 30, -10]
  })).result

  console.log('[02] target:', box1, 'tool:', cyl)

  // Subtract with keepTools: true
  const r = await api.v1.solid.subtraction({ id: eifId, target: box1, tools: [cyl], keepTools: true })
  console.log('[02] result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('result')

  // Verify tool is still valid
  const copyR = await api.v1.solid.copy({ id: eifId, solid: cyl })
  console.log('[02] tool still valid — copy result:', copyR.result, 'maxLevel:', copyR.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, toolStillValid: copyR.maxLevel <= 31 }, 'keeptools-result')

  return { partId }
}
