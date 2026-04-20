export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OverwriteTest' })).result

  // Set initial value
  const r1 = await api.v1.common.setUserData({ id: partId, key: 'test', value: 'first' })
  console.log('[04] set first: maxLevel=', r1.maxLevel)

  const v1 = (await api.v1.common.getUserData({ id: partId, key: 'test' })).result
  console.log('[04] after first set:', v1)

  // Try to overwrite
  const r2 = await api.v1.common.setUserData({ id: partId, key: 'test', value: 'second' })
  console.log('[04] set second: maxLevel=', r2.maxLevel, 'messages:', JSON.stringify(r2.messages))

  const v2 = (await api.v1.common.getUserData({ id: partId, key: 'test' })).result
  console.log('[04] after second set:', v2)

  // Try to overwrite again
  const r3 = await api.v1.common.setUserData({ id: partId, key: 'test', value: 'third' })
  console.log('[04] set third: maxLevel=', r3.maxLevel, 'messages:', JSON.stringify(r3.messages))

  const v3 = (await api.v1.common.getUserData({ id: partId, key: 'test' })).result
  console.log('[04] after third set:', v3)

  // Does removing then re-setting work?
  const rr = await api.v1.common.removeUserData({ id: partId, key: 'test' })
  console.log('[04] remove: maxLevel=', rr.maxLevel)

  const v4 = (await api.v1.common.getUserData({ id: partId, key: 'test', defaultValue: 'GONE' })).result
  console.log('[04] after remove:', v4)

  const r4 = await api.v1.common.setUserData({ id: partId, key: 'test', value: 'new-value' })
  console.log('[04] set new after remove: maxLevel=', r4.maxLevel)

  const v5 = (await api.v1.common.getUserData({ id: partId, key: 'test' })).result
  console.log('[04] after re-set:', v5)

  filewrite({
    step1: { setMaxLevel: r1.maxLevel, value: v1 },
    step2: { setMaxLevel: r2.maxLevel, messages: r2.messages, value: v2 },
    step3: { setMaxLevel: r3.maxLevel, messages: r3.messages, value: v3 },
    afterRemove: v4,
    step4: { setMaxLevel: r4.maxLevel, value: v5 },
  }, 'overwrite-results')

  return { partId }
}
