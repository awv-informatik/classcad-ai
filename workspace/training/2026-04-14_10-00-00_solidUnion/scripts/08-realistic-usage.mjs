// 08 — Realistic usage: L-shaped bracket via union of two boxes
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LBracket' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Horizontal base
  const base = (await api.v1.solid.box({
    id: eifId, length: 120, width: 40, height: 20
  })).result

  // Vertical arm (overlaps one end of the base)
  const arm = (await api.v1.solid.box({
    id: eifId, length: 20, width: 40, height: 100
  })).result

  console.log('[08] base:', base, 'arm:', arm)

  await snapshot('before-L-bracket')

  // Union to form L-shape
  const r = await api.v1.solid.union({ id: eifId, target: base, tools: [arm] })
  console.log('[08] union result:', r.result, 'maxLevel:', r.maxLevel)

  await snapshot('after-L-bracket')

  // Now add a reinforcement gusset (small box at corner)
  const gusset = (await api.v1.solid.box({
    id: eifId, length: 20, width: 40, height: 20,
    translation: [20, 0, 20]
  })).result

  console.log('[08] gusset:', gusset)

  // Chain another union onto the existing result
  const r2 = await api.v1.solid.union({ id: eifId, target: base, tools: [gusset] })
  console.log('[08] chain union result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('final-L-bracket')

  return { partId, eifId }
}
