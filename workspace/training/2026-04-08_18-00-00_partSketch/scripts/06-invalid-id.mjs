// 06 — Error cases: invalid part ID, missing id param
export default async function (api, { filewrite }) {
  // Missing id param entirely
  const r1 = await api.v1.part.sketch({})
  console.log('[06] no id — maxLevel:', r1.maxLevel, 'result:', r1.result)
  console.log('[06] no id — messages:', JSON.stringify(r1.messages))

  // Non-existent id
  const r2 = await api.v1.part.sketch({ id: 99999 })
  console.log('[06] bad id — maxLevel:', r2.maxLevel, 'result:', r2.result)
  console.log('[06] bad id — messages:', JSON.stringify(r2.messages))

  // Negative id
  const r3 = await api.v1.part.sketch({ id: -1 })
  console.log('[06] negative id — maxLevel:', r3.maxLevel, 'result:', r3.result)
  console.log('[06] negative id — messages:', JSON.stringify(r3.messages))

  filewrite({ noId: r1.messages, badId: r2.messages, negId: r3.messages }, 'error-messages')

  return { noIdLevel: r1.maxLevel, badIdLevel: r2.maxLevel, negIdLevel: r3.maxLevel }
}
