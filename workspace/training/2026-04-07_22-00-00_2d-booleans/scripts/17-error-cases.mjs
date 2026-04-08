// 17 — Error cases: missing params, invalid IDs, empty shapes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({})).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const s1 = (await api.v1.curve.shape({ id: eifId })).result
  await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })

  // Missing tool
  console.log('[17] Test A: missing tool...')
  const rA = await api.v1.curve.union2d({ target: s1 })
  console.log('[17] A maxLevel:', rA.maxLevel)
  if (rA.messages?.length) console.log('[17] A msg:', rA.messages[0].message.slice(0, 120))

  // Missing target
  console.log('[17] Test B: missing target...')
  const rB = await api.v1.curve.union2d({ tool: s1 })
  console.log('[17] B maxLevel:', rB.maxLevel)
  if (rB.messages?.length) console.log('[17] B msg:', rB.messages[0].message.slice(0, 120))

  // Invalid ID
  console.log('[17] Test C: invalid ID...')
  const rC = await api.v1.curve.union2d({ target: s1, tool: 99999 })
  console.log('[17] C maxLevel:', rC.maxLevel)
  if (rC.messages?.length) console.log('[17] C msg:', rC.messages[0].message.slice(0, 120))

  // Empty shape (no curves)
  console.log('[17] Test D: empty shape as tool...')
  const s2 = (await api.v1.curve.shape({ id: eifId })).result // empty, no curves
  const rD = await api.v1.curve.union2d({ target: s1, tool: s2 })
  console.log('[17] D maxLevel:', rD.maxLevel)
  if (rD.messages?.length) console.log('[17] D msg:', rD.messages[0].message.slice(0, 120))

  // Empty shape as target
  console.log('[17] Test E: empty shape as target...')
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s3 = (await api.v1.curve.shape({ id: eif2 })).result // empty
  const s4 = (await api.v1.curve.shape({ id: eif2 })).result
  await api.v1.curve.circle({ id: s4, centerPos: [0, 0, 0], radius: 20 })
  const rE = await api.v1.curve.union2d({ target: s3, tool: s4 })
  console.log('[17] E maxLevel:', rE.maxLevel)
  if (rE.messages?.length) console.log('[17] E msg:', rE.messages[0].message.slice(0, 120))

  return { partId }
}
