// 07 — Verify tool is consumed (default keepTools=false)
// After union without keepTools, try to use the tool — should fail
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UnionConsumed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 60, height: 40
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, 0]
  })).result

  console.log('[07] box1:', box1, 'box2:', box2)

  // Union without keepTools (default = false)
  const r = await api.v1.solid.union({ id: eifId, target: box1, tools: [box2] })
  console.log('[07] union result:', r.result, 'maxLevel:', r.maxLevel)

  // Now try to copy box2 — should fail because it was consumed
  const copyR = await api.v1.solid.copy({ id: eifId, target: box2, translation: [0, 0, 100] })
  console.log('[07] copy consumed box2 result:', copyR.result, 'maxLevel:', copyR.maxLevel)
  console.log('[07] copy messages:', JSON.stringify(copyR.messages))

  filewrite({
    unionResult: r.result,
    copyResult: copyR.result,
    copyMaxLevel: copyR.maxLevel,
    copyMessages: copyR.messages
  }, 'tool-consumed-check')

  return { partId, eifId }
}
