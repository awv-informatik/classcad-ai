export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ClearInvalid' })).result
  console.log('[03] partId:', partId)

  // id: 0
  const r0 = await api.v1.common.clearUserData({ id: 0 })
  console.log('[03] id=0 — result:', r0.result, 'maxLevel:', r0.maxLevel)
  console.log('[03] id=0 — messages:', JSON.stringify(r0.messages))

  // nonexistent id
  const r999 = await api.v1.common.clearUserData({ id: 9999 })
  console.log('[03] id=9999 — result:', r999.result, 'maxLevel:', r999.maxLevel)
  console.log('[03] id=9999 — messages:', JSON.stringify(r999.messages))

  // missing id param entirely
  const rNone = await api.v1.common.clearUserData({})
  console.log('[03] no id — result:', rNone.result, 'maxLevel:', rNone.maxLevel)
  console.log('[03] no id — messages:', JSON.stringify(rNone.messages))

  filewrite({
    idZero: { result: r0.result, maxLevel: r0.maxLevel, messages: r0.messages },
    idNonexistent: { result: r999.result, maxLevel: r999.maxLevel, messages: r999.messages },
    idMissing: { result: rNone.result, maxLevel: rNone.maxLevel, messages: rNone.messages },
  }, 'invalid-ids-response')

  return { partId }
}
