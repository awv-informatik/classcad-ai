// 09 — Multiple features in `from` array, using two part.box features
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiFrom' })).result

  // Create 2 part-level boxes
  const box1 = (await api.v1.part.box({ id: partId, name: 'Box1', length: 60, width: 40, height: 30 })).result
  const box2 = (await api.v1.part.box({ id: partId, name: 'Box2', length: 30, width: 50, height: 25 })).result
  console.log('[09] box1 feat:', box1, 'box2 feat:', box2)

  // Pull both into one EI
  const eif = (await api.v1.part.entityInjection({ id: partId, name: 'TargetEI' })).result
  const r = await api.v1.solid.useSolid({ from: [box1, box2], in: eif })
  console.log('[09] useSolid from [box1, box2] result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'multi-from')

  // Verify: try to manipulate one of the returned solids
  if (r.result && r.result.length >= 2) {
    const [s1, s2] = r.result
    const tr = await api.v1.solid.translation({ id: eif, target: s2, translation: [80, 0, 0] })
    console.log('[09] translate s2 result:', tr.result, 'maxLevel:', tr.maxLevel)
  }

  await snapshot('multi-from')
  return { result: r.result }
}
