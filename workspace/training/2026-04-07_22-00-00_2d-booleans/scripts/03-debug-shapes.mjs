// 03 — Debug: inspect shapes before boolean to understand IDs/structure
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BoolTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const s1 = (await api.v1.curve.shape({ id: eifId, name: 'Target' })).result
  console.log('[03] shape1 ID:', s1, typeof s1)

  const circleR = await api.v1.curve.circle({ id: s1, centerPos: [0, 0, 0], radius: 30 })
  console.log('[03] circle1 result:', circleR.result, 'maxLevel:', circleR.maxLevel)

  const s2 = (await api.v1.curve.shape({ id: eifId, name: 'Tool' })).result
  console.log('[03] shape2 ID:', s2, typeof s2)

  const circleR2 = await api.v1.curve.circle({ id: s2, centerPos: [25, 0, 0], radius: 30 })
  console.log('[03] circle2 result:', circleR2.result, 'maxLevel:', circleR2.maxLevel)

  // Dump the structure tree to see what the shapes look like
  const structR = await api.v1.common.getAppVersion({})
  filewrite(circleR2.structure, 'structure-after-shapes')

  await snapshot('two-circles')

  // Try different approaches:

  // Approach 1: Maybe target/tool should be EI IDs, not shape IDs?
  console.log('[03] Trying with EI IDs...')
  const r1 = await api.v1.curve.union2d({ target: eifId, tool: eifId })
  console.log('[03] union2d(eif,eif) result:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[03] messages:', r1.messages[0].message.slice(0, 100))

  // Approach 2: Maybe target/tool should be part IDs?
  console.log('[03] Trying with part IDs...')
  const r2 = await api.v1.curve.union2d({ target: partId, tool: partId })
  console.log('[03] union2d(part,part) result:', r2.result, 'maxLevel:', r2.maxLevel)
  if (r2.messages?.length) console.log('[03] messages:', r2.messages[0].message.slice(0, 100))

  // Approach 3: Maybe the shapes need to be in separate EIs?
  console.log('[03] Trying shapes in separate EIs...')
  const eif2 = (await api.v1.part.entityInjection({ id: partId })).result
  const s3 = (await api.v1.curve.shape({ id: eif2, name: 'Tool2' })).result
  await api.v1.curve.circle({ id: s3, centerPos: [25, 0, 0], radius: 30 })

  const r3 = await api.v1.curve.union2d({ target: s1, tool: s3 })
  console.log('[03] union2d(s1,s3 diff EIs) result:', r3.result, 'maxLevel:', r3.maxLevel)
  if (r3.messages?.length) console.log('[03] messages:', r3.messages[0].message.slice(0, 100))

  return { partId }
}
