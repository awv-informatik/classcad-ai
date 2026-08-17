// 05 — Does snapshot() between shape creation and union2d cause the error?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Test A: NO snapshot before union2d
  console.log('[05] Test A: No snapshot before union...')
  const eif1 = (await api.v1.part.entityInjection({ id: partId })).result
  const s1 = (await api.v1.curve.shape({ id: eif1 })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })
  const s2 = (await api.v1.curve.shape({ id: eif1 })).result
  await api.v1.curve.circle({ id: s2, centerPos: [25, 0, 0], radius: 30 })
  // NO snapshot here
  const rA = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[05] A maxLevel:', rA.maxLevel, rA.messages?.length ? rA.messages[0].message.slice(0, 80) : 'no msg')

  // Test B: WITH snapshot before union2d
  console.log('[05] Test B: Snapshot before union...')
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s3 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s3, centerPos: [0, 0, 0], radius: 30 })
  const s4 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s4, centerPos: [25, 0, 0], radius: 30 })
  await snapshot('before-union-B') // snapshot here!
  const rB = await api.v1.curve.union2d({ target: s3, tool: s4 })
  console.log('[05] B maxLevel:', rB.maxLevel, rB.messages?.length ? rB.messages[0].message.slice(0, 80) : 'no msg')

  // Test C: WITH snapshot, then openFeature before union2d
  console.log('[05] Test C: Snapshot + openFeature before union...')
  const eif3 = (await api.v1.part.entityInjection({ id: partId })).result
  const s5 = (await api.v1.curve.shape({ id: eif3 })).result
  await api.v1.curve.circle({ id: s5, centerPos: [0, 0, 0], radius: 30 })
  const s6 = (await api.v1.curve.shape({ id: eif3 })).result
  await api.v1.curve.circle({ id: s6, centerPos: [25, 0, 0], radius: 30 })
  await snapshot('before-union-C')
  await api.v1.part.openFeature({ id: eif3 })
  const rC = await api.v1.curve.union2d({ target: s5, tool: s6 })
  console.log('[05] C maxLevel:', rC.maxLevel, rC.messages?.length ? rC.messages[0].message.slice(0, 80) : 'no msg')
  await api.v1.part.closeFeature({ id: eif3 })

  await snapshot('final')
  return { partId }
}
