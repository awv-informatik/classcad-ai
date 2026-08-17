// 02 — keepTools: true — do tool solids survive?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UnionKeepTools' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const box1 = (await api.v1.solid.box({
    id: eifId, length: 100, width: 60, height: 40
  })).result

  const box2 = (await api.v1.solid.box({
    id: eifId, length: 60, width: 40, height: 80,
    translation: [60, 30, 0]
  })).result

  console.log('[02] box1:', box1, 'box2:', box2)

  // Union with keepTools: true
  const r = await api.v1.solid.union({ id: eifId, target: box1, tools: [box2], keepTools: true })
  console.log('[02] union result:', r.result, 'maxLevel:', r.maxLevel)

  filewrite({ result: r.result, maxLevel: r.maxLevel, messages: r.messages }, 'keepTools-response')

  await snapshot('after-keepTools-union')

  // Test: can we still reference box2? Try to get its info or use it
  // Try copying box2 — if it was consumed, this should fail
  const copyR = await api.v1.solid.copy({ id: eifId, target: box2, translation: [0, 0, 100] })
  console.log('[02] copy box2 result:', copyR.result, 'maxLevel:', copyR.maxLevel)
  console.log('[02] copy box2 messages:', JSON.stringify(copyR.messages))

  filewrite({ copyResult: copyR.result, copyMaxLevel: copyR.maxLevel, copyMessages: copyR.messages }, 'keepTools-copy-check')

  await snapshot('after-keepTools-copy')

  return { partId, eifId, box1, box2, unionResult: r.result }
}
