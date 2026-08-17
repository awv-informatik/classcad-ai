// 02 — Can we use the returned solid IDs for boolean/transform operations?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UseReturnedIds' })).result

  // Create two part-level boxes
  const box1Feat = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const box2Feat = (await api.v1.part.box({ id: partId, name: 'Box2', length: 40, width: 40, height: 60 })).result
  console.log('[02] box1 feature:', box1Feat, 'box2 feature:', box2Feat)

  // Create an entity injection
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'WorkEI' })).result

  // Pull both into EI
  const r = await api.v1.solid.useSolid({ from: [box1Feat, box2Feat], in: eifId })
  console.log('[02] useSolid result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'useSolid-two-features')

  const [solidId1, solidId2] = r.result
  console.log('[02] solid IDs from useSolid:', solidId1, solidId2)

  await snapshot('before-ops')

  // Try translating one of the useSolid'd solids
  const tr = await api.v1.solid.translation({ id: eifId, target: solidId2, translation: [50, 20, 0] })
  console.log('[02] translation result:', tr.result, 'maxLevel:', tr.maxLevel)

  await snapshot('after-translate')

  // Try boolean subtraction using useSolid'd solids
  const sub = await api.v1.solid.subtraction({ id: eifId, target: solidId1, tools: [solidId2] })
  console.log('[02] subtraction result:', sub.result, 'maxLevel:', sub.maxLevel)

  filewrite({ translateResult: tr.result, translateMaxLevel: tr.maxLevel, subResult: sub.result, subMaxLevel: sub.maxLevel }, 'ops-results')

  await snapshot('after-subtraction')
  return { solidId1, solidId2 }
}
