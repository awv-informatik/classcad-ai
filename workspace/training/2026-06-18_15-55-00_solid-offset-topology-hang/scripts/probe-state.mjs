export default async function (api) {
  const part = (await api.v1.part.create({ name: 'Probe' })).result
  const eif = (await api.v1.part.entityInjection({ id: part })).result
  const box = (await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })).result
  const c1 = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [15, 15, -5] })).result
  const c2 = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [45, 15, -5] })).result
  const c3 = (await api.v1.solid.cylinder({ id: eif, height: 50, diameter: 10, translation: [30, 30, -5] })).result
  const sub = await api.v1.solid.subtraction({ id: eif, target: box, tools: [c1, c2, c3] })
  console.log('sub maxLevel:', sub.maxLevel, 'messages:', JSON.stringify(sub.messages))
  // Probe each entity via massprops (consumed -> error/no volume)
  for (const [name, id] of [['box', box], ['c1', c1], ['c2', c2], ['c3', c3]]) {
    const mp = await api.v1.part.calculateMassProperties({ id }).catch(e => ({ error: e.message }))
    console.log(`${name}(${id}): maxLevel ${mp.maxLevel} vol ${mp.result?.volume ?? '-'} msgs ${JSON.stringify(mp.messages ?? mp.error)?.slice(0,60)}`)
  }
}
