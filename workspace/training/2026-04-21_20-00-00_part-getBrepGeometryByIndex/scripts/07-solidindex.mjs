export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  await api.v1.common.recalc({})

  // Test solidIndex on a single-solid feature
  const r0 = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 0, solidIndex: 0 })
  console.log(`[07] solidIndex=0: result=${r0.result}, maxLevel=${r0.maxLevel}`)

  const r1 = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 0, solidIndex: 1 })
  console.log(`[07] solidIndex=1: result=${r1.result}, maxLevel=${r1.maxLevel}`)
  if (r1.messages) console.log(`[07] solidIndex=1 messages:`, r1.messages.map(m => m.message).join('; '))

  const rNeg = await api.v1.part.getBrepGeometryByIndex({ id: boxId, lineIndex: 0, solidIndex: -1 })
  console.log(`[07] solidIndex=-1: result=${rNeg.result}, maxLevel=${rNeg.maxLevel}`)
  if (rNeg.messages) console.log(`[07] solidIndex=-1 messages:`, rNeg.messages.map(m => m.message).join('; '))

  filewrite({
    solidIndex0: { result: r0.result, maxLevel: r0.maxLevel, messages: r0.messages },
    solidIndex1: { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages },
    solidIndexNeg: { result: rNeg.result, maxLevel: rNeg.maxLevel, messages: rNeg.messages },
  }, 'solidindex-tests')
  return { partId }
}
